// Hashtags (#): texto vira toque em posts, stories e comentários; sugestões ao digitar #; página da hashtag (notícias + posts + comentários);
// seguir (fica nas preferências do usuário); Feed sobe o que é seguido; Buscar com "#tag", seguidas e "Em alta entre amigos"; notícias com hashtags;
// escape de hashtag maliciosa; validar.py confere o campo hashtags. Capturas em qa/hashtags/ (claro, 390 px, foco ligado).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const PORTA = 8921, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'hashtags'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const shot = async (p, nome) => { await sleep(350); await ev(p, () => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(QA, nome + '.png') }) };
const TOOLS = path.join(__dirname, '..', '..', 'tools');

/* ---------- 0. validar.py (sem navegador) ---------- */
function validarHashtags() {
  const f = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8'));
  const ps = f.pautas; ps[0].hashtags = ['#PECdaSegurança', '#Senado']; ps[1].hashtags = ['#Debate', 'Sem cerquilha', '#com espaço', '#a'];
  ps[2].hashtags = ['#TSE', '#tse']; ps[3].hashtags = ['#A1', '#B2', '#C3', '#D4', '#E5']; ps[4].hashtags = ['#ForaFulano', '#Pesquisas']; ps[5].hashtags = ['#senado', '#Atos'];
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'htv-')); const fp = path.join(dir, 'feed.json'); fs.writeFileSync(fp, JSON.stringify(f));
  const prev = JSON.parse(JSON.stringify(f)); prev.pautas[0].hashtags = ['#Escala6x1', '#Trabalho']; const pp = path.join(dir, 'prev.json'); fs.writeFileSync(pp, JSON.stringify(prev));
  let out = ''; try { out = execFileSync('python3', [path.join(TOOLS, 'validar.py'), fp, '--prev', pp], { encoding: 'utf8' }) } catch (e) { out = String(e.stdout || '') }
  const L = out.split('\n'); const tem = re => L.some(l => re.test(l));
  ok(!tem(/\[pec-6x1-senado\].*hashtag inválida/) && !tem(/ERRO: \[pec-6x1-senado\].*hashtag/), 'validar: #PECdaSegurança e #Senado aceitas (acento vale)');
  ok(tem(/^ERRO: \[debate-band\] hashtag inválida 'Sem cerquilha'/) && tem(/^ERRO: \[debate-band\] hashtag inválida '#com espaço'/) && tem(/^ERRO: \[debate-band\] hashtag inválida '#a'/), 'validar: ERRO sem #, com espaço e curta demais');
  ok(tem(/^ERRO: \[canais-whatsapp\] hashtags repetidas/), 'validar: ERRO em repetidas (#TSE e #tse)');
  ok(tem(/^ERRO: \[video-nikolas\] 5 hashtags/), 'validar: ERRO com mais de 4');
  ok(tem(/^AVISO: \[pesquisas\] hashtag '#ForaFulano' parece opinativa/), 'validar: AVISO em hashtag opinativa');
  ok(tem(/^AVISO: a mesma hashtag com grafias diferentes \(#Senado, #senado\)/), 'validar: AVISO em grafias diferentes da mesma hashtag');
  ok(tem(/^AVISO: \[pec-6x1-senado\] a cobertura trocou todas as hashtags/), 'validar: AVISO quando a cobertura troca todas as hashtags');
  // aplicar.py: pauta sem o campo herda as hashtags da edição anterior e as dormentes guardam
  const base = JSON.parse(JSON.stringify(f)); base.pautas.forEach(p => delete p.hashtags); base.pautas[0].subtema = 'Congresso'; base.pautas[0].hashtags = ['#Escala6x1', '#Senado'];
  base.pautas[1].subtema = 'Eleições 2026'; base.pautas[1].hashtags = ['#Debates', '#Eleições2026'];
  const novo = JSON.parse(JSON.stringify(base)); novo.pautas.forEach(p => delete p.hashtags); novo.pautas.splice(1, 1);
  const bp = path.join(dir, 'base.json'), np = path.join(dir, 'novo.json'), op = path.join(dir, 'saida.json'); fs.writeFileSync(bp, JSON.stringify(base)); fs.writeFileSync(np, JSON.stringify(novo));
  try { execFileSync('python3', [path.join(TOOLS, 'aplicar.py'), np, '-o', op, '--prev', bp], { encoding: 'utf8' }) } catch (e) { console.log(String(e.stdout || e.message).slice(0, 400)) }
  const s = fs.existsSync(op) ? JSON.parse(fs.readFileSync(op, 'utf8')) : {};
  ok(JSON.stringify((s.pautas || [])[0]?.hashtags) === '["#Escala6x1","#Senado"]', 'aplicar: cobertura que continua mantém as hashtags', (s.pautas || [])[0]?.hashtags);
  ok(JSON.stringify(((s.dormentes || []).find(d => d.id === 'debate-band') || {}).hashtags) === '["#Debates","#Eleições2026"]', 'aplicar: dormente guarda as hashtags');
}

(async () => {
  validarHashtags();
  const f = U.feedFresco('site');
  // uma pauta do Copom com hashtags escolhidas pela rodada (as outras usam as derivadas de tag/tema)
  const c0 = JSON.parse(JSON.stringify(f.pautas.find(p => p.id === 'focus-ipca-522')));
  Object.assign(c0, { id: 'copom-selic-15', tag: 'Juros', tema: 'Copom', subtema: 'Juros e inflação', prioridade: 99, hashtags: ['#Copom', '#Selic'], hora: f.atualizado_em,
    neutro: { titulo: 'Copom mantém a Selic em 15% e sinaliza cortes em 2027', texto: 'O Comitê de Política Monetária manteve a taxa básica de juros em 15% ao ano pela quinta reunião seguida.', pontos: ['Selic fica em 15% ao ano.', 'É a quinta manutenção seguida.', 'Próxima reunião em dezembro.'] }, direita: null, esquerda: null, enquete: null });
  f.pautas.unshift(c0); fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f));
  const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [a, b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } } }), nome); await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-foco', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk && FEED && typeof abrirHashtag === 'function', null, 15000); return p };
  const A = await abrir(a, 'a@x', 'A'), B = await abrir(b, 'b@x', 'B');
  const fecha = p => ev(p, () => { let g = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && g++ < 6) closeLayer() });
  ok(await ev(A, () => document.documentElement.classList.contains('foco')), 'foco em notícia ligado (como em produção)');

  /* ---------- 1. regras ---------- */
  const r = await ev(A, () => ({
    k: htExtrai('Olá #Previdência e #previdencia, veja https://x.com/#ancora e site.com/p#frag; #1 #a #Copom#Selic (#PEC_da_Segurança) a#b').map(x => x.tag),
    ch: [htChave('#Previdência'), htChave('previdencia'), htChave('#PEC_da_Segurança')], max: htExtrai(Array.from({ length: 14 }, (_, i) => '#tag' + 'abcdefghijklmn'[i]).join(' ')).length,
    longa: htExtrai('#' + 'a'.repeat(31)).length, ok30: htExtrai('#' + 'a'.repeat(30)).length,
    der: htDaPauta(FEED.pautas.find(p => p.id === 'focus-ipca-522')), der2: htDaPauta(FEED.pautas.find(p => p.id === 'caso-master')), ex: htDaPauta(FEED.pautas.find(p => p.id === 'copom-selic-15'))
  }));
  ok(JSON.stringify(r.k) === '["#Previdência","#Copom","#PEC_da_Segurança"]', 'extrai: acento, sem duplicar pela chave, fora de links, sem número puro/curta, sem colar em palavra', r.k);
  ok(r.ch[0] === 'previdencia' && r.ch[1] === 'previdencia' && r.ch[2] === 'pecdaseguranca', 'chave normalizada: sem acento, minúscula, sem "_"', r.ch);
  ok(r.max === 10 && r.longa === 0 && r.ok30 === 1, 'limites: até 10 por texto, até 30 caracteres', [r.max, r.longa, r.ok30]);
  ok(JSON.stringify(r.ex) === '["#Copom","#Selic"]' && JSON.stringify(r.der) === '["#Inflação"]' && JSON.stringify(r.der2) === '["#STF","#CasoMaster"]', 'notícias: campo hashtags; sem ele, derivadas de tag/tema', [r.ex, r.der, r.der2]);

  /* ---------- 2. Pedro escreve um post com #Copom (sugestão ao digitar) ---------- */
  await ev(A, () => { go('feed'); criarAbrir('post') }); await sleep(500);
  await clk(A, '#layer [data-edsotexto]'); await sleep(400);
  await A.focus('#ce-leg'); await A.keyboard.type('Juros parados de novo. #Cop');
  ok(await esperar(A, () => { const b = document.querySelector('.ht-box'); return b && b.querySelector('[data-htsug]')?.dataset.htsug === '#Copom' && /Nas notícias/.test(b.textContent) }), 'sugestão: #Cop sugere #Copom (das notícias da edição) primeiro');
  await shot(A, 'hashtags-2-sugestao-ao-digitar');
  await A.$eval('.ht-box [data-htsug="#Copom"]', e => e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))); await sleep(200);
  ok(await ev(A, () => document.querySelector('#ce-leg').value === 'Juros parados de novo. #Copom ' && !document.querySelector('.ht-box')), 'sugestão: tocar completa "#Copom " e fecha a lista');
  await A.keyboard.type('O que vocês acham? #Selic');
  const n0 = await ev(A, () => PUB.itens.filter(x => x.tipo === 'post').length);
  await clk(A, '[data-edpubpo]'); ok(await esperar(A, n => !ED && PUB.itens.filter(x => x.tipo === 'post').length === n + 1, n0, 20000), 'post publicado');
  const post = (await H.sql(`select id,texto from publicacoes where autor=$1 and tipo='post'`, [a]))[0];
  ok(post && post.texto === 'Juros parados de novo. #Copom O que vocês acham? #Selic', 'texto gravado como foi escrito (hashtags ficam no texto, sem SQL novo)', post && post.texto);

  /* ---------- 3. Bia vê o post e toca em #Copom ---------- */
  await ev(B, () => pubCarregar()); await sleep(600);
  await ev(B, id => { closeLayer(); go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id) }, post.id); await sleep(500);
  ok(await esperar(B, id => { const a = document.getElementById('p-u:' + id); return a && [...a.querySelectorAll('.ht-a')].map(x => x.dataset.ht).join() === '#Copom,#Selic' }, post.id, 6000), 'post da Bia: #Copom e #Selic viram toque');
  await ev(B, id => document.getElementById('p-u:' + id).scrollIntoView({ block: 'start' }), post.id); await ev(B, () => scrollBy(0, -60));
  await shot(B, 'hashtags-1-post-com-tags');
  await ev(B, id => document.querySelector(`[id="p-u:${id}"] .ht-a[data-ht="#Copom"]`).click(), post.id);
  ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="copom"]')), 'tocar abre a página #Copom');
  const pg = await ev(B, id => { const el = document.querySelector('#layer .pfv-ht'); return { h: el.querySelector('.pfv-h b').textContent, nots: [...el.querySelectorAll('[data-htnot]')].map(b => b.dataset.htnot), post: !!el.querySelector(`.ht-posts [data-pid="u:${id}"]`), seg: el.querySelector('[data-htseg]').textContent } }, post.id);
  ok(/^#Copom/.test(pg.h) && pg.nots[0] === 'copom-selic-15' && pg.post && pg.seg === 'Seguir', 'página: cabeçalho, notícia do Copom primeiro, post do Pedro e "Seguir"', pg);
  await shot(B, 'hashtags-3-pagina-da-hashtag');
  // notícia aberta pela página volta para a página
  await clk(B, '#layer .pfv-ht [data-htnot="copom-selic-15"]'); ok(await esperar(B, () => !!document.querySelector('#layer .mat')), 'notícia abre a matéria');
  ok(await ev(B, () => document.querySelector('#layer .mat-v').textContent === '‹ #Copom' && [...document.querySelectorAll('#layer .ht-mat [data-ht]')].map(b => b.dataset.ht).join() === '#Copom,#Selic'), 'matéria: "‹ #Copom" e as hashtags da notícia');
  await shot(B, 'hashtags-5-materia');
  await clk(B, '#layer .mat-v'); ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="copom"]') && !document.querySelector('#layer .mat')), 'voltar da matéria devolve à página #Copom');
  // #Selic dentro do post na página → outra página; voltar → #Copom
  await ev(B, () => document.querySelector('#layer .pfv-ht .ht-posts .ht-a[data-ht="#Selic"]').click());
  ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="selic"]')), 'hashtag dentro da página abre a outra página');
  await ev(B, () => history.back()); ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="copom"]')), 'voltar: de #Selic para #Copom');
  await ev(B, () => history.back()); ok(await esperar(B, () => !$('#layer').innerHTML && VIEW === 'feed'), 'voltar: de #Copom para o Feed');

  /* ---------- 4. seguir ---------- */
  await ev(B, () => abrirHashtag('#copom')); await esperar(B, () => !!document.querySelector('#layer .pfv-ht'));
  ok(await ev(B, () => document.querySelector('#layer .pfv-ht .pfv-h b').textContent.startsWith('#Copom')), 'grafia da página vem da notícia (#copom → #Copom)');
  await clk(B, '#layer .pfv-ht [data-htseg]'); await sleep(200);
  ok(await ev(B, () => PREF.hashtags && PREF.hashtags.copom === '#Copom' && document.querySelector('#layer [data-htseg]').getAttribute('aria-pressed') === 'true' && document.querySelector('#layer [data-htseg]').textContent === 'Seguindo'), 'Seguir: botão vira "Seguindo" e grava em PREF.hashtags');
  await sleep(2200);
  const prefsBanco = await H.sql(`select * from docs where path=$1`, ['data/users/' + b + '/prefs']).catch(() => []);
  ok(prefsBanco.length && JSON.stringify(prefsBanco[0]).includes('#Copom'), 'seguir fica no documento de preferências da Bia (sem tabela nova)', JSON.stringify(prefsBanco).slice(0, 200));
  await fecha(B);
  // Feed: notícia e post seguidos sobem, com o rótulo
  await ev(B, () => { FILTRO = 'tudo'; LIDAS.set('copom-selic-15', 'x'); renderPosts() }); await sleep(300);
  const fd = await ev(B, () => { const l = listaFeed().map(p => p.id); const a = document.querySelector('#posts [id="p-focus-ipca-522"]'); return { l: l.slice(0, 4), lab: [...document.querySelectorAll('#posts .ht-por')].map(x => x.textContent) } });
  ok(fd.lab.some(t => t === 'Por seguir #Copom'), 'Feed: rótulo "Por seguir #Copom"', fd);
  await ev(B, () => { LIDAS.delete('copom-selic-15'); PREF.hashtags.selic = '#Selic'; renderPosts() }); await sleep(200);
  const fd2 = await ev(B, () => { const l = listaFeed(); return l.findIndex(p => p.id === 'focus-ipca-522') });
  await ev(B, () => { delete PREF.hashtags.selic; PREF.hashtags.inflacao = '#Inflação'; }); const fd3 = await ev(B, () => listaFeed().findIndex(p => p.id === 'focus-ipca-522'));
  await ev(B, () => { delete PREF.hashtags.inflacao; renderPosts() });
  ok(fd3 >= 1 && fd3 <= 3 && fd2 > 3, 'Feed: notícia com hashtag seguida sobe para o topo (não lida)', [fd2, fd3]);
  const pm = await ev(B, id => { const l = pubMistura(Array.from({ length: 12 }, (_, i) => ({ id: 'x' + i }))); return l.findIndex(x => x.__pub && x.__pub.id === id) }, post.id);
  ok(pm >= 0 && pm <= 2, 'Feed: post com hashtag seguida fica entre os primeiros', pm);

  /* ---------- 5. comentário com hashtag (sugestão no campo de comentário) ---------- */
  await ev(B, () => openComments('copom-selic-15')); await sleep(300);
  await B.focus('#ctext'); await B.keyboard.type('Concordo com o corte só em 2027 #Se');
  ok(await esperar(B, () => [...document.querySelectorAll('.ht-box [data-htsug]')].some(b => b.dataset.htsug === '#Selic')), 'comentário: #Se sugere #Selic');
  await B.$eval('.ht-box [data-htsug="#Selic"]', e => e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))); await sleep(150);
  ok(await ev(B, () => document.querySelector('#ctext').value === 'Concordo com o corte só em 2027 #Selic '), 'comentário: sugestão completa o texto');
  await clk(B, '#cform .sendc'); await sleep(900);
  ok(await esperar(B, () => !!document.querySelector('#cbox .clist .ht-a[data-ht="#Selic"]')), 'comentário publicado com #Selic tocável');
  await shot(B, 'hashtags-6-comentario');
  await ev(B, () => document.querySelector('#cbox .clist .ht-a[data-ht="#Selic"]').click());
  ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="selic"] .ht-cms li')), 'página #Selic mostra o comentário');
  ok(await ev(B, () => /Copom mantém a Selic/.test(document.querySelector('#layer .ht-cms').textContent) && !!document.querySelector('#layer .ht-cms .ht-a[data-ht="#Selic"]')), 'comentário na página diz onde foi feito');
  await ev(B, () => history.back()); ok(await esperar(B, () => !!document.querySelector('#cform') && !document.querySelector('#layer .pfv-ht')), 'voltar da página devolve aos comentários');
  await fecha(B);
  // Pedro também vê o comentário da Bia com a hashtag
  await sleep(500); await ev(A, () => openComments('copom-selic-15'));
  ok(await esperar(A, () => !!document.querySelector('#cbox .clist .ht-a[data-ht="#Selic"]'), null, 6000), 'Pedro vê #Selic no comentário da Bia');
  await fecha(A);

  /* ---------- 6. Buscar ---------- */
  await ev(B, () => go('busca')); await sleep(300);
  ok(await ev(B, () => { const s = [...document.querySelectorAll('#bvres .ht-bv')]; return s.length === 2 && /Hashtags que você segue/.test(s[0].textContent) && !!s[0].querySelector('[data-ht="#Copom"]') && /Em alta entre amigos/.test(s[1].textContent) && /#Copom/.test(s[1].textContent) }), 'Buscar: "Hashtags que você segue" e "Em alta entre amigos" (Pedro usou #Copom)');
  await shot(B, 'hashtags-7-buscar-inicio');
  await B.fill('#bvq', '#copom'); await sleep(300);
  const br1 = await ev(B, () => { const l = [...document.querySelectorAll('#bvres .ht-res li button')]; return { t: l.map(b => b.textContent), first: l[0] && l[0].dataset.ht, nots: !!document.querySelector('#bvres [data-busca="copom-selic-15"]') } });
  ok(br1.first === '#Copom' && /1 notícia · 1 post/.test(br1.t[0]) && /seguindo/.test(br1.t[0]) && br1.nots, 'Buscar "#copom": grupo Hashtags com contagens e as notícias', br1);
  await shot(B, 'hashtags-4-buscar');
  await clk(B, '#bvres .ht-res [data-ht="#Copom"]'); ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="copom"]')), 'Buscar: toque abre a página');
  await ev(B, () => history.back()); ok(await esperar(B, () => !$('#layer').innerHTML && VIEW === 'busca' && $('#bvq').value === '#copom'), 'voltar devolve à Busca com o termo');
  await B.fill('#bvq', '#Novidade'); await sleep(250);
  ok(await ev(B, () => { const b = document.querySelector('#bvres .ht-res [data-ht="#Novidade"]'); return b && /Nada ainda/.test(b.textContent) }), 'Buscar: hashtag nova aparece (dá para abrir e seguir)');

  /* ---------- 7. notícias no Feed com hashtags discretas ---------- */
  await ev(B, () => { go('feed'); FILTRO = 'tudo'; renderPosts() }); await sleep(400);
  ok(await ev(B, () => { const a = document.getElementById('p-copom-selic-15'); return a && [...a.querySelectorAll('.ht-nl [data-ht]')].map(b => b.dataset.ht).join() === '#Copom,#Selic' }), 'cartão da notícia: #Copom #Selic');
  await ev(B, () => garantirPost('focus-ipca-522'));
  ok(await ev(B, () => { const a = document.getElementById('p-focus-ipca-522'); return a && !!a.querySelector('.ht-nl [data-ht="#Inflação"]') }), 'cartão sem o campo: hashtag derivada (#Inflação)');

  /* ---------- 8. story com cartão de texto ---------- */
  await ev(A, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: 'Hoje tem #Copom', fotos: [], estilo: { v: 2, itens: [{ t: 'texto', tx: 'Hoje tem #Copom', x: .5, y: .45, f: 'classico', cor: '#ffffff' }] }, expira: Date.now() + 864e5 }); await pubCarregar() });
  await ev(B, () => pubCarregar()); await sleep(400);
  await ev(B, u => { closeLayer(); igAbrirUser(u) }, a); await sleep(600);
  ok(await esperar(B, () => !!document.querySelector('#layer .us-tx .ht-a[data-ht="#Copom"]')), 'story: #Copom do cartão de texto vira toque');
  const pt = await ev(B, () => { const r = document.querySelector('#layer .us-tx .ht-a').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] });
  await B.mouse.click(pt[0], pt[1]);
  ok(await esperar(B, () => !!document.querySelector('#layer .pfv-ht[data-k="copom"]')), 'story: tocar na hashtag abre a página');
  await fecha(B);

  /* ---------- 9. escape ---------- */
  await ev(A, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Teste #<img src=x onerror=window.__xss=1> e #Ok<img src=y onerror=window.__xss=2> "#Aspas"onmouseover="window.__xss=3"', fotos: [], estilo: { v: 2 } }); await pubCarregar() });
  await ev(B, () => pubCarregar()); await sleep(500);
  const xid = (await H.sql(`select id from publicacoes where texto like 'Teste #<img%'`))[0].id;
  await ev(B, id => { closeLayer(); go('feed'); renderPosts(); garantirPost('u:' + id) }, xid); await sleep(600);
  const xs = await ev(B, id => { const a = document.getElementById('p-u:' + id); return { img: a ? a.querySelectorAll('img:not(.up-img)').length : -1, tags: a ? [...a.querySelectorAll('.ht-a')].map(b => b.dataset.ht) : [], txt: a ? a.querySelector('.up-tx,.up-leg').textContent : '', xss: window.__xss || 0, attr: a ? [...a.querySelectorAll('.ht-a')].every(b => b.attributes.length === 3) : false } }, xid);
  ok(xs.img === 0 && xs.xss === 0 && JSON.stringify(xs.tags) === '["#Ok","#Aspas"]' && /#<img src=x onerror/.test(xs.txt) && xs.attr, 'escape: "#<img…>" fica texto; só #Ok e #Aspas viram toque, sem atributos extras', xs);
  await ev(B, () => abrirHashtag('#<img src=x onerror=window.__xss=4>')); await sleep(300);
  ok(await ev(B, () => !document.querySelector('#layer .pfv-ht') && !window.__xss), 'abrir hashtag inválida não abre página nem executa nada');
  await ev(B, () => { PREF.hashtags['x"><img src=z onerror=window.__xss=5>'] = '#"><img src=z onerror=window.__xss=5>'; go('busca') }); await sleep(400);
  ok(await ev(B, () => !window.__xss && !document.querySelector('#bvres img')), 'preferência adulterada não injeta HTML na Busca');
  await ev(B, () => { delete PREF.hashtags['x"><img src=z onerror=window.__xss=5>'] });

  ok(!A._erros.length && !B._erros.length, 'sem erros na página', A._erros.concat(B._erros).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_hashtags: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
