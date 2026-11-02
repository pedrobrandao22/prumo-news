// Etapa 71: aba de atividade (♥), cobertura seguida avisa, debate dos amigos na enquete
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8780/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8780); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await A.evaluate(() => atLedSalva({ _t0: Date.now() - 864e5, _b: 1 })); // app já usado antes (fora da janela inicial)
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => { go('feed') }); await sleep(800);
  ok(await ev(A, () => !!document.querySelector('.top-in .at-b[data-ativ]')), 'botão ♥ no topo do Feed');
  // primeira abertura: a amizade com a Bia já existia antes (linha de base), nada novo além disso
  await ev(A, () => atItens()); 
  // Pedro publica, vota numa enquete e segue uma cobertura com atualização recente
  const pid = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Meu post', fotos: [], estilo: { v: 2 } }).select('id'); return r.data[0].id });
  const enq = await ev(A, async () => { const p = FEED.pautas.find(p => p.enquete && p.enquete.opcoes.length); await votar(p.id, 0); return p.id });
  const cob = await ev(A, () => { const p = FEED.pautas.find(p => !p.enquete && temaDe(p)); p.atualizacoes = [{ hora: new Date(Date.now() - 3600e3).toISOString(), texto: 'Relator apresentou novo parecer' }]; cobSegue(temaDe(p), true); return p.id });
  await sleep(800);
  // Bia curte, comenta, vota diferente e debate
  await ev(B, () => { go('feed'); pubCarregar() }); await sleep(1500);
  (await ev(B, async id => { const a = await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'curtida', chave: '' }); const b = await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'comentario', chave: 'c1x', valor: { texto: 'Que legal!' } }); return [a.error, b.error] }, pid));
  await ev(B, async id => { await votar(id, 2) }, enq); await sleep(1200);
  await ev(B, id => debAbrir(id), enq); await sleep(500);
  ok(await ev(B, () => /Votei “Não aprova” porque/.test(document.querySelector('#ctext').value) && !!document.querySelector('.sheet .deb-c .deb-o.eu')), 'Bia: debate abre com o voto dela no começo do comentário e o placar dos amigos');
  await B.fill('#ctext', 'Votei “Não aprova” porque faltam votos'); await clk(B, '#cform .sendc'); await sleep(1200); await ev(B, () => closeLayer()); await sleep(300);
  await ev(A, () => { AT.t = 0; atCarregar() }); await esperar(A, () => AT.rows.length >= 2, null, 8000).catch(() => {}); await sleep(1500);
  ok(await ev(A, () => !document.querySelector('.top-in .at-dot').hidden), 'bolinha vermelha no ♥ com novidades');
  await clk(A, '.top-in [data-ativ]'); await sleep(900);
  const txt = await ev(A, () => document.querySelector('#layer .pfv-at').textContent);
  ok(/Bia Souza curtiu seu post/.test(txt), 'curtida no meu post', txt.slice(0, 400));
  ok(/Bia Souza comentou: “Que legal!”/.test(txt), 'comentário no meu post');
  ok(/votou diferente de você/.test(txt), 'voto diferente na enquete');
  ok(/comentou na enquete/.test(txt), 'comentário da amiga numa enquete em que votei');
  ok(/que você segue, teve uma atualização: “Relator apresentou novo parecer”/.test(txt), 'atualização de cobertura seguida');
  ok(/Você e Bia Souza agora são amigos/.test(txt), 'amizade nova (Bia entrou pelo convite depois)');
  ok(await ev(A, () => document.querySelectorAll('#layer .at-l')[0] && /Novas/.test(document.querySelector('#layer .at-h').textContent)), 'seção Novas');
  await A.screenshot({ path: SH + 'd71-atividade.png' });
  ok(await ev(A, () => document.querySelector('.top-in .at-dot').hidden), 'abrir a aba apaga a bolinha');
  // tocar no debate abre os comentários com o placar e o voto de cada um
  await ev(A, () => { const i = AT._l.findIndex(x => x.k.startsWith('cn:')); document.querySelector(`#layer [data-ati="${i}"]`).click() }); await sleep(900);
  ok(await ev(A, () => !!document.querySelector('.sheet .deb-c') && /Não aprova/.test(document.querySelector('.sheet .deb-v')?.textContent || '')), 'debate: comentário da Bia mostra o voto dela');
  await A.screenshot({ path: SH + 'd71-debate.png' }); await ev(A, () => closeLayer()); await sleep(400);
  // no card da enquete aparece o botão do debate
  ok(await ev(A, id => { updateSocial(id); return /Ver o debate · 1 comentário/.test(enqueteHTML(pautaById(id))) }, enq), 'enquete mostra "Ver o debate"');
  // tocar na curtida leva ao post
  await ev(A, () => abrirAtividade()); await sleep(600);
  await ev(A, () => { const i = AT._l.findIndex(x => x.k.startsWith('curtida:')); document.querySelector(`#layer [data-ati="${i}"]`).click() }); await sleep(1200);
  ok(await ev(A, id => !document.querySelector('#layer .pfv-at') && !!document.getElementById('p-u:' + id), pid), 'tocar na curtida leva ao post');
  // pedido de amizade novo aparece com Aceitar
  const c = await H.criarConta('c@x', '123456'); await H.sql(`insert into public.membros(uid,nome) values ($1,'Caio')`, [c]); await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'pendente')`, [c, await ev(A, () => S.uid)]);
  await ev(A, () => location.reload()); await esperar(A, () => S.membro && S.amigosOk && S.pedidosIn.length === 1, null, 10000); await sleep(1000);
  await ev(A, () => abrirAtividade()); await sleep(700);
  ok(await ev(A, () => /Caio quer ser seu amigo/.test(document.querySelector('#layer .pfv-at').textContent) && !!document.querySelector('#layer .pfv-at [data-aceitar]')), 'pedido de amizade com Aceitar');
  await clk(A, '#layer .pfv-at [data-aceitar]'); await sleep(1500);
  ok(await ev(A, () => /Você e Caio agora são amigos/.test(document.querySelector('#layer .pfv-at').textContent)), 'depois de aceitar: "agora são amigos"');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa71: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
