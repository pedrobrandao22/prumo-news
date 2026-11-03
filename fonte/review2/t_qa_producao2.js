// QA de produção 2 (03/11): vida de vários dias de um grupo, o lado da amiga, recarregar no meio. Flags de produção ligadas.
// Amizade desfeita tira anel/posts na hora e amigo novo traz os stories; menção no story e resposta de pergunta na conversa;
// post em segundo plano vira rascunho se o app fechar; rascunho de mensagem e de comentário; "Denunciar" para o administrador;
// story vencido sai da bandeja; voto na pergunta na Atividade; Feed comprido sem travar ao rolar; destaque volta ao perfil.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8984, BASE = `http://localhost:${PORTA}/index.html`; const F2 = __dirname + '/../qa2/f2.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { ED = null; for (let i = 0; i < 4 && ($('#layer2').innerHTML || $('#layer').innerHTML); i++) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim']) localStorage.setItem('prumo-teste-' + k, '1') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1200); await fecha(p) }
async function convite(A) { await ev(A, () => go('me')); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const recarrega = async p => { await p.reload(); await esperar(p, () => S.membro && S.amigosOk && PUB.on, null, 12000); await sleep(800) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  for (const p of [A, B, C]) await flags(p);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  await criar(C, { url: await convite(A), nome: 'Carla Dias', email: 'c@x.com' });
  const uA = await ev(A, () => S.uid), uB = await ev(B, () => S.uid), uC = await ev(C, () => S.uid);
  for (const p of [A, B, C]) { await ev(p, () => go('feed')); await esperar(p, () => PUB.on === true, null, 8000) }
  const storyTexto = async (p, txt, els, pub = 'amigos') => { await ev(p, () => criarAbrir('story')); await sleep(500); await clk(p, '[data-edcriar]'); await sleep(400); await p.keyboard.type(txt); await ev(p, () => edTextoOk()); await sleep(200);
    if (els) await ev(p, els => els.forEach((e, i) => edAdd({ ...e, y: .62 + i * .12 })), els); await sleep(200); await clk(p, `[data-edpubst='${pub}']`); await esperar(p, () => !ED && !PQ.atual, null, 20000); await sleep(300) };

  // ===== 1. menção no story e resposta da pergunta, na conversa
  await storyTexto(A, 'Menção', [{ t: 'men', uid: uB, tx: '@Bia Souza' }]);
  await storyTexto(A, 'Pergunta', [{ t: 'perg', q: 'Que notícia vocês querem amanhã?' }]);
  await ev(B, () => { scrollTo(0, 0) }); await esperar(B, u => pubStoriesDe(u).length === 2, uA, 8000);
  ok(await ev(B, () => S.msgsIn.some(m => m.tipo === 'mencao') && dmPrevia(S.msgsIn.find(m => m.tipo === 'mencao')) === 'Mencionou você no story'), 'prévia da menção no story: "Mencionou você no story" (não "num post")');
  await ev(B, u => abrirConversa(u), uA); await sleep(1000);
  ok(await ev(B, () => { const lb = [...document.querySelectorAll('#v-msgs .dm-lb')].map(x => x.textContent); return lb.includes('Mencionou você no story') && !lb.some(t => /num post/.test(t)) && ![...document.querySelectorAll('#v-msgs .bub')].some(x => /Mencionou você no story/.test(x.textContent)) }), 'conversa: "Mencionou você no story" uma vez (sem "num post" nem balão repetido)', await ev(B, () => document.querySelector('#v-msgs .thread').innerText.slice(0, 200)));
  // Bia responde a pergunta
  const sP = await ev(B, u => pubStoriesDe(u)[1].id, uA);
  await ev(B, () => go('feed')); await sleep(300); await ev(B, id => igAbrirUser(pubDe(id).autor, id), sP); await sleep(1200);
  await ev(B, () => { const e = [...document.querySelectorAll('#layer .story *')].filter(e => e.children.length === 0 && e.textContent.trim() === 'Toque para responder').pop(); e.click() }); await sleep(700);
  await B.keyboard.type('Sobre o Copom'); await ev(B, () => [...document.querySelectorAll('.sheet button')].find(b => b.textContent.trim() === 'Enviar').click()); await sleep(1200); await fecha(B); await sleep(400);
  await ev(A, u => abrirConversa(u), uB); await esperar(A, () => [...document.querySelectorAll('#v-msgs .bub')].some(b => /Sobre o Copom/.test(b.textContent)), null, 8000); await sleep(400);
  ok(await ev(A, () => { const q = document.querySelector('#v-msgs .ca100-sq'); if (!q) return false; const m = q.closest('.dm-m') || q.parentElement; return document.querySelectorAll('#v-msgs .ca100-st').length === 1 && !(m && m.querySelector('.dm-ucard')) && /Respondeu à sua pergunta/.test(q.textContent) }), 'resposta da pergunta: o story aparece uma vez (sem o cartão grande repetido)', await ev(A, () => document.querySelector('#v-msgs .thread').innerHTML.length));
  ok(await ev(B, () => { const id = '00000000-0000-4000-8000-000000000001', c = (t, st) => dmCard({ de: S.uid, pid: 'u:' + id, snap: { titulo: t, upub: id, ...(st ? { story: true } : {}) } });
    const p = c('Post de Pedro Brandão'), st = c('Story de Pedro Brandão', 1), fora = c('Post de Fulano de Tal');
    return /Esta publicação não está mais disponível/.test(p) && !/dm-utx/.test(p) && /Este story não está mais disponível/.test(st) && /Só quem é amigo do autor/.test(fora) }), 'cartão de post apagado / story vencido de um amigo: "não está mais disponível" (sem "Só quem é amigo" nem "Post de Fulano" repetido)');
  await ev(A, () => go('feed')); await ev(B, () => go('feed')); await sleep(300);

  // ===== 2. Atividade: voto na pergunta de um post
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-cn102ini="enq"]'); await sleep(300);
  await A.keyboard.type('Vocês vão ver o jogo?'); await A.fill('[data-cn102o="0"]', 'Vou'); await A.fill('[data-cn102o="1"]', 'Não vou');
  await clk(A, '[data-edpubpo]'); await esperar(A, () => !ED && !PQ.atual, null, 20000); await sleep(800);
  const idQ = await ev(A, () => PUB.itens.find(x => x.tipo === 'post' && x.autor === S.uid).id);
  await esperar(B, id => !!document.querySelector(`[id="p-u:${id}"] [data-cn102voto="0"]`), idQ, 8000); await clk(B, `[id="p-u:${idQ}"] [data-cn102voto="0"]`); await sleep(1200);
  ok(await esperar(A, () => atItens().some(x => /Bia Souza<\/b> votou na sua pergunta$/.test(x.txt)), null, 8000), 'Atividade: "Bia Souza votou na sua pergunta"', await ev(A, () => atItens().map(x => x.txt).join('|')));

  // ===== 3. administrador: "Denunciar" no perfil do amigo
  await ev(A, u => abrirPerfil(u), uB); await sleep(1200); await ev(A, () => document.querySelector('#layer .pfv-h [data-fd104pm]').click()); await sleep(400);
  ok(await ev(A, () => { const t = document.querySelector('.sheet [data-denp]')?.textContent || ''; return /fica na sua lista da Administração/.test(t) && !/o Pedro recebe/.test(t) }), 'administrador: "Denunciar" diz que fica na lista da Administração');
  await fecha(A); await ev(B, u => abrirPerfil(u), uA); await sleep(1200); await ev(B, () => document.querySelector('#layer .pfv-h [data-fd104pm]').click()); await sleep(400);
  ok(await ev(B, () => /o Pedro recebe e analisa/.test(document.querySelector('.sheet [data-denp]')?.textContent || '')), 'membro comum continua lendo "o Pedro recebe e analisa"');
  await fecha(B);

  // ===== 4. destaque aberto pelo perfil de um amigo volta ao perfil
  await ev(A, () => { scrollTo(0, 0) }); await clk(A, '#secs [data-meustory]'); await sleep(1200);
  await clk(A, '#layer [data-usdest]'); await sleep(500); await clk(A, '#layer2 [data-destnovo]'); await sleep(1200); await A.fill('#dest-nome', 'Verão'); await clk(A, '[data-destcriar]'); await sleep(1500); await fecha(A);
  await ev(B, u => abrirPerfil(u), uA); await esperar(B, () => !!document.querySelector('#layer [data-pfdest]'), null, 6000); await clk(B, '#layer [data-pfdest]'); await sleep(1500);
  ok(await ev(B, () => !!document.querySelector('#layer .story')), 'destaque abre');
  await B.goBack(); await sleep(1200);
  ok(await ev(B, () => !!document.querySelector('#layer .pfv') && !document.querySelector('#layer .story')), 'voltar do celular no destaque volta ao perfil do amigo (não ao Feed)');
  await fecha(B); await sleep(300);

  // ===== 5. rascunhos de mensagem e de comentário sobrevivem a recarregar
  await ev(B, u => abrirConversa(u), uA); await sleep(800); await B.fill('#mtext', 'Rascunho que eu ia mandar'); await sleep(200);
  await recarrega(B); await ev(B, u => abrirConversa(u), uA); await sleep(800);
  ok(await ev(B, () => document.querySelector('#mtext').value === 'Rascunho que eu ia mandar' && !document.querySelector('#mform .send').disabled), 'rascunho da mensagem volta depois de recarregar (botão de enviar ativo)');
  await clk(B, '#mform .send'); await sleep(1000); await recarrega(B); await ev(B, u => abrirConversa(u), uA); await sleep(800);
  ok(await ev(B, () => document.querySelector('#mtext').value === ''), 'depois de enviar, o rascunho some');
  await ev(B, () => go('feed')); await sleep(500); const pid = await ev(B, () => FEED.pautas[0].id);
  await ev(B, p => openComments(p), pid); await sleep(600); await B.fill('#ctext', 'Comentário pela metade'); await sleep(200);
  await recarrega(B); await ev(B, p => openComments(p), pid); await sleep(600);
  ok(await ev(B, () => document.querySelector('#ctext').value === 'Comentário pela metade'), 'rascunho do comentário volta depois de recarregar');
  await fecha(B);

  // ===== 6. post publicado em segundo plano e o app fecha no meio: fica nos rascunhos e avisa
  await ev(B, () => { go('feed'); const o = window.__sb; window.__sb = j => { try { if (JSON.parse(j).op.kind === 'st_up') return new Promise(r => setTimeout(() => r(o(j)), 8000)) } catch (e) { } return o(j) } });
  await ev(B, () => criarAbrir('post')); await sleep(500); await clk(B, '[data-edpgal]'); await B.setInputFiles('#ce-pfile', [F2]); await esperar(B, () => ED.po.fotos.length === 1, null, 6000); await sleep(300);
  await clk(B, '[data-edav]'); await sleep(400); await clk(B, '[data-edav]'); await sleep(400); await B.fill('#ce-leg', 'Post publicado e o app fechou'); await clk(B, '[data-edpubpo]'); await sleep(1200);
  ok(await ev(B, () => !!PQ.atual && !document.querySelector('#layer .ce')), 'publicando em segundo plano (editor fechado)');
  await B.reload(); await esperar(B, () => S.membro && S.amigosOk, null, 12000);
  ok(await esperar(B, () => /não terminou de publicar/.test(document.querySelector('.toast')?.textContent || ''), null, 7000), 'ao abrir de novo: aviso de que o post ficou nos rascunhos');
  ok(await ev(B, async () => (await rascLista()).some(r => r.texto === 'Post publicado e o app fechou' && r.fotos.length === 1)), 'o post (foto e legenda) está nos rascunhos');
  await ev(B, () => document.querySelector('.toast .toast-a').click()); await esperar(B, () => ED && ED.po && ED.po.fotos.length === 1, null, 6000); await sleep(400);
  ok(await ev(B, () => ED.po.texto === 'Post publicado e o app fechou'), '"Abrir" leva ao editor com a foto e a legenda');
  await clk(B, '[data-edpubpo]').catch(async () => { await clk(B, '[data-edav]'); await sleep(400); await clk(B, '[data-edav]'); await sleep(400); await clk(B, '[data-edpubpo]') });
  await esperar(B, () => !ED && !PQ.atual, null, 20000); await sleep(2500);
  ok(await ev(B, async () => !(await rascLista()).length) && (await H.sql(`select count(*)::int n from public.publicacoes where texto = 'Post publicado e o app fechou'`))[0].n === 1, 'publicado: sai dos rascunhos e existe uma vez só');
  await recarrega(B); await sleep(2500); ok(await ev(B, () => !/não terminou/.test(document.querySelector('.toast')?.textContent || '')), 'sem aviso depois de publicar');
  // o servidor recebeu, mas o app fechou antes da resposta: sem aviso e sem rascunho (não publica duas vezes)
  await ev(B, () => { const o = window.__sb; window.__sb = j => { try { const op = JSON.parse(j).op; if (op.kind === 'from' && op.table === 'publicacoes' && op.action === 'insert') return o(j).then(r => new Promise(ok => setTimeout(() => ok(r), 8000))) } catch (e) { } return o(j) } });
  await ev(B, () => criarAbrir('post')); await sleep(500); await clk(B, '[data-edpgal]'); await B.setInputFiles('#ce-pfile', [F2]); await esperar(B, () => ED.po.fotos.length === 1, null, 6000); await sleep(300);
  await clk(B, '[data-edav]'); await sleep(400); await clk(B, '[data-edav]'); await sleep(400); await B.fill('#ce-leg', 'Chegou ao servidor'); await clk(B, '[data-edpubpo]');
  await esperar(B, () => true, null, 100); for (let i = 0; i < 60; i++) { if ((await H.sql(`select count(*)::int n from public.publicacoes where texto = 'Chegou ao servidor'`))[0].n) break; await sleep(100) }
  await sleep(300); await B.reload(); await esperar(B, () => S.membro && S.amigosOk && PUB.carregou, null, 12000); await sleep(4500);
  ok(await ev(B, async () => !/não terminou/.test(document.querySelector('.toast')?.textContent || '') && !(await rascLista()).length), 'post que chegou ao servidor antes de o app fechar: sem aviso e sem rascunho');

  // ===== 7. amizade desfeita: o anel e os posts somem da amiga na hora; amiga nova traz os stories
  await ev(C, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: 'Story da Carla', fotos: [], estilo: { fundo: 2 }, publico: 'amigos', expira: Date.now() + 864e5 }) });
  await ev(B, () => { go('feed'); scrollTo(0, 0) }); await sleep(800);
  await ev(B, u => { const x = pubVisiveis().find(x => x.autor === u && x.tipo === 'post'); if (x) garantirPost('u:' + x.id); scrollTo(0, 0) }, uA); await sleep(300);
  ok(await ev(B, u => !!document.querySelector(`#secs [data-ustory="${u}"]`) && [...document.querySelectorAll('#posts .upost')].some(p => (pubDe(p.id.slice(4)) || {}).autor === u), uA), 'antes: Bia vê o anel e o post do Pedro');
  await ev(A, async u => { await SB.rpc('desfazer_amizade', { p_uid: u }) }, uB);
  ok(await esperar(B, u => !S.amigos.has(u) && !document.querySelector(`#secs [data-ustory="${u}"]`) && ![...document.querySelectorAll('#posts .upost')].some(p => (pubDe(p.id.slice(4)) || {}).autor === u), uA, 6000), 'amizade desfeita: anel e posts do Pedro saem do Feed da Bia sem recarregar');
  ok(await ev(B, u => !document.querySelector(`#secs [data-ustory="${u}"]`), uC), 'Carla ainda não é amiga da Bia: sem anel');
  await ev(B, u => SB.rpc('pedir_amizade', { p_uid: u }), uC); await sleep(600); await ev(C, u => SB.rpc('responder_amizade', { p_uid: u, p_aceitar: true }), uB);
  ok(await esperar(B, u => !!document.querySelector(`#secs [data-ustory="${u}"]`), uC, 6000), 'amizade aceita: o story da Carla aparece na bandeja da Bia sem recarregar');

  // ===== 8. story que vence com a Bia olhando sai da bandeja; o toque avisa
  const now = Date.now(); await H.db.exec('set session_replication_role = replica');
  await H.sql(`insert into public.publicacoes(autor,tipo,at,expira,texto,fotos,estilo,publico) values ($1,'story',$2,$3,'Quase vencendo','[]','{"fundo":1}','amigos')`, [uC, now - 864e5 + 4000, now + 4000]); await H.db.exec('set session_replication_role = origin');
  await H.sql(`delete from public.publicacoes where autor=$1 and texto='Story da Carla'`, [uC]);
  await ev(B, () => pubCarregar()); await esperar(B, u => pubStoriesDe(u).length === 1 && !!document.querySelector(`#secs [data-ustory="${u}"]`), uC, 6000); await sleep(4500);
  await ev(B, u => document.querySelector(`#secs [data-ustory="${u}"]`).click(), uC); await sleep(700);
  ok(await ev(B, u => !document.querySelector('#layer .story') && !document.querySelector(`#secs [data-ustory="${u}"]`) && /não está mais disponível/.test(document.querySelector('.toast')?.textContent || ''), uC), 'story vencido: o toque avisa e o anel sai da bandeja');

  // ===== 9. Feed comprido: os posts que chegam ao rolar não são medidos todos de uma vez
  await ev(B, async () => { for (let i = 0; i < 14; i++) await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Post ' + i, fotos: [], estilo: { fundo: i % 6 }, publico: 'amigos' }) });
  await ev(B, () => { pubCarregar() }); await sleep(1500); await ev(B, () => { go('capa'); go('feed'); scrollTo(0, 0) }); await sleep(800);
  const m = await ev(B, async () => { let n = 0; const o = fitTrack; fitTrack = function () { n++; return o.apply(this, arguments) }; const p0 = LOTE.pos; let sinc = -1;
    try { carregarMais(); sinc = n } finally { fitTrack = o } await new Promise(r => setTimeout(r, 600)); const novos = [...document.querySelectorAll('#posts > .post')].slice(p0).map(x => x.querySelector('.track')).filter(Boolean);
    return { sinc, lote: LOTE.pos - p0, ok: novos.length > 0 && novos.every(t => !!t.style.getPropertyValue('--slh')) } });
  ok(m.lote > 0 && m.sinc === 0 && m.ok, 'rolar o Feed: lote novo é medido aos poucos (nenhuma medida dentro do lote) e fica com a altura certa', JSON.stringify(m));

  // ===== 10. ver os stories de um amigo: o anel fica "visto" ao fechar; no outro aparelho também
  const B2 = U.erros(await H.pagina(b, { sessao: JSON.parse(await ev(B, () => localStorage.getItem('sb-fake-session'))) }), 'B2'); await flags(B2);
  await B2.goto(BASE); await esperar(B2, () => S.membro && S.amigosOk && PUB.on, null, 12000); await sleep(800); await fecha(B2);
  await ev(C, async () => { for (let i = 0; i < 2; i++) await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: 'Story ' + (i + 1), fotos: [], estilo: { fundo: 2 }, publico: 'amigos', expira: Date.now() + 864e5 }) }); await sleep(1200);
  for (const p of [B, B2]) await ev(p, () => { go('feed'); pubCarregar(); scrollTo(0, 0) }); await esperar(B, u => pubStoriesDe(u).length === 2, uC, 6000); await esperar(B2, u => pubStoriesDe(u).length === 2, uC, 6000); await sleep(6000);
  await clk(B, `#secs [data-ustory="${uC}"]`); await sleep(1200); await B.touchscreen.tap(350, 420); await sleep(1000); await B.touchscreen.tap(362, 40); await sleep(1500);
  ok(await ev(B, u => !document.querySelector('#layer .story') && document.querySelector(`#secs [data-ustory="${u}"] .ig-r`).classList.contains('visto'), uC), 'viu todos os stories da Carla: ao fechar, o anel fica cinza (visto)');
  await ev(B2, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) }); await sleep(300);
  await ev(B2, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')) });
  ok(await esperar(B2, u => document.querySelector(`#secs [data-ustory="${u}"] .ig-r`)?.classList.contains('visto'), uC, 6000), 'no outro aparelho da Bia o anel também fica visto ao voltar ao app');
  ok(!B2._erros.length, 'sem erros no 2º aparelho ' + B2._erros.join('|'));
  ok(await ev(B, () => { toast('Pedro Brandão não consegue abrir este post, então não foi avisado.'); const r = document.querySelector('.toast').getBoundingClientRect(); return r.width > innerWidth * .7 && r.height < 80 && r.left >= 0 && r.right <= innerWidth }), 'aviso longo usa a largura da tela (não fica numa coluna estreita)');
  ok(!A._erros.length && !B._erros.length && !C._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros).join('|'));
  await b.close(); srv.kill(); const R = U.resumo(); console.log(`\nRESUMO t_qa_producao2: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
