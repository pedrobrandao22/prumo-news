// Criar numa caixa só (152, 14/11): o "+" abre Post · Giro · Coluna; texto publica dali; juntar Notícia/Enquete/Número/De perto
// abre o formulário com o texto e sem a faixa de tipos; voltar traz o texto; Coluna mostra rascunhos e Nova coluna;
// "Minhas colunas" no Perfil; "giro" no lugar de "story". Porta 8909.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8909/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8909); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);

  // 1. o "+" abre a caixa
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152 #cp152-tx')), 'o "+" abre a caixa de escrever');
  ok(await ev(A, () => [...document.querySelectorAll('[data-cp152aba]')].map(b => b.textContent).join('|') === 'Post|Giro|Coluna'), 'no alto: Post, Giro e Coluna');
  ok(await ev(A, () => [...document.querySelectorAll('[data-cp152ax]')].map(b => b.textContent.trim()).join('|') === 'Foto|Notícia|Enquete|Número|De perto'), 'juntar: Foto, Notícia, Enquete, Número, De perto');
  ok(await ev(A, () => document.querySelector('[data-cp152pub]').disabled), 'Publicar desligado sem texto');
  ok(await ev(A, () => !/Minhas colunas|O que você quer publicar/.test(document.querySelector('#layer').innerText)), 'sem "Minhas colunas" nem os cartões antigos na caixa');

  // 2. só texto publica dali
  await A.fill('#cp152-tx', 'Primeiro post pela caixa'); await sleep(100); await U.foto(A, 'criar-caixa-post');
  ok(await ev(A, () => !document.querySelector('[data-cp152pub]').disabled), 'Publicar liga com texto');
  await clk(A, '[data-cp152pub]');
  ok(await esperar(A, () => PUB.itens.some(x => x.autor === S.uid && x.tipo === 'post' && x.texto === 'Primeiro post pela caixa') && !document.querySelector('#layer').innerHTML, null, 8000), 'texto publica direto e a tela fecha');
  ok(await esperar(A, () => { const x = PUB.itens.find(x => x.texto === 'Primeiro post pela caixa'); const el = x && document.getElementById('p-u:' + x.id); if (!el) return false; const r = el.getBoundingClientRect(); return VIEW === 'feed' && r.top >= 0 && r.top < innerHeight * .6 }, null, 6000), 'depois de publicar, o post aparece na tela do Feed');

  // 3. Notícia: formulário com o texto e sem a faixa de tipos; voltar traz o texto
  await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'Acho que isso muda tudo'); await clk(A, '[data-cp152ax="nt"]'); await sleep(600);
  ok(await ev(A, () => ED && ED.po && ED.po.cn && ED.po.cn.k === 'nt' && ED.po.cn.corpo === 'Acho que isso muda tudo'), 'Notícia: formulário com o texto escrito');
  ok(await ev(A, () => !!document.querySelector('#layer .cn102-ntl')), 'Notícia: abre a lista de notícias');
  await ev(A, () => document.querySelector('#layer [data-edselx]')?.click()); await sleep(300);
  ok(await ev(A, () => { const k = document.querySelector('#layer .cn102-ks'); return !k || k.hidden }), 'formulário sem a faixa de tipos repetida');
  await ev(A, () => document.querySelector('#layer [data-edvolta]').click()); await sleep(500);
  ok(await ev(A, () => document.querySelector('#cp152-tx') && document.querySelector('#cp152-tx').value === 'Acho que isso muda tudo'), 'voltar traz a caixa com o texto', await ev(A, () => document.querySelector('#layer').className + ' ' + document.querySelector('#layer').innerText.slice(0, 80)));

  // 4. Enquete: o texto vira a pergunta; Número abre o seletor de número
  await clk(A, '[data-cp152ax="enq"]'); await sleep(500);
  ok(await ev(A, () => ED && ED.po.cn.k === 'enq' && ED.po.cn.tit === 'Acho que isso muda tudo'), 'Enquete: o texto vira a pergunta');
  await ev(A, () => document.querySelector('#layer [data-edvolta]').click()); await sleep(400);
  await clk(A, '[data-cp152ax="ana"]'); await sleep(600);
  ok(await ev(A, () => ED && ED.po.cn.k === 'ana' && !!document.querySelector('#layer .cn102-dp')), 'Número: análise com o seletor de número aberto');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // 5. Coluna: Nova coluna e rascunho
  await ev(A, () => { localStorage.setItem(ed132RK(), JSON.stringify([{ rid: 'abcd1234', at: Date.now(), tit: 'Minha coluna guardada', html: '<p>oi</p>', pal: 1 }])) });
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '[data-cp152aba="coluna"]'); await sleep(300);
  ok(await ev(A, () => /Continuar escrevendo/i.test(document.querySelector('#layer').innerText) && /Minha coluna guardada/.test(document.querySelector('[data-cp152rasc]').textContent)), 'Coluna: continuar o rascunho');
  await U.foto(A, 'criar-caixa-coluna'); await clk(A, '[data-cp152rasc]'); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#layer > .ed132') && ED132.E && ED132.E.tit === 'Minha coluna guardada'), 'rascunho abre no editor de coluna');
  await ev(A, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '[data-cp152aba="coluna"]'); await clk(A, '[data-cp152nova]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .ed132') && ED132.E && !ED132.E.tit), 'Nova coluna abre o editor vazio');
  await ev(A, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // 5b. Foto: abre a galeria no mesmo toque, já no criador de post
  await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'Legenda da foto');
  const [fcf] = await Promise.all([A.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null), clk(A, '[data-cp152ax="foto"]')]); await sleep(400);
  ok(!!fcf && await ev(A, () => !!document.querySelector('#layer .ce') && ED && ED.modo === 'post' && ED.po.texto === 'Legenda da foto'), 'Foto: abre a galeria e o criador de post com a legenda', await ev(A, () => document.querySelector('#layer').className + '|' + (document.querySelector('#layer').firstElementChild || {}).className + '|' + !!document.querySelector('#ce-pfile')));
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // 6. Giro e volta
  await ev(A, () => criarMenu()); await sleep(300); await clk(A, '[data-cp152aba="giro"]'); await sleep(600);
  ok(await ev(A, () => ED && ED.modo === 'story' && !!document.querySelector('#layer .ce')), 'Giro abre o editor de giro');
  const post = await A.$('#layer [data-edmodo="post"], #layer [data-crtipo="post"]');
  if (post) { await post.evaluate(e => e.click()); await sleep(500); ok(await ev(A, () => !!document.querySelector('#layer > .cp152')), 'POST no editor de giro volta para a caixa') }
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // 7. Perfil: Minhas colunas
  await ev(A, () => go('me')); await sleep(700);
  ok(await ev(A, () => !!document.querySelector('#v-me [data-cp152cols]')), 'Perfil tem "Minhas colunas"'); await U.foto(A, 'criar-caixa-perfil');
  await clk(A, '#v-me [data-cp152cols]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .ed132-hubr')), '"Minhas colunas" abre a lista');
  await ev(A, () => closeLayer()); await sleep(300);
  await ev(A, () => { document.querySelector('#v-me .gut').insertAdjacentHTML('beforeend', '<button type="button" class="btn" id="tcx165" data-criarde="post">Nova publicação</button>') }); await clk(A, '#tcx165'); await sleep(500); await ev(A, () => document.querySelector('#tcx165')?.remove());
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152')), '"Nova publicação" abre a caixa');
  await ev(A, () => closeLayer()); await sleep(300);

  // 8. "giro", não "story"
  await ev(A, () => { go('feed') }); await sleep(400);
  const txt = await ev(A, () => document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label],[placeholder]')].map(e => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('placeholder') || '')).join(' '));
  ok(!/\b(story|stories|Story|Stories)\b/.test(txt), 'nenhum "story" na tela', (txt.match(/.{0,30}\b[Ss]tor(y|ies)\b.{0,20}/) || [''])[0]);
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_criar_caixa: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
