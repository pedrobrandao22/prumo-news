// Foco em notícia e conteúdo (105): sem Boomerang/Layout/Timer/emojis/figurinhas de brincadeira; câmera que começa pela notícia,
// cartão de texto, fundos sóbrios, atalhos de contexto na foto, "via Prumo", reações sóbrias, pedido de fonte, comentar pela matéria.
// Roda com localStorage "prumo-teste-foco"="1" (o estado de produção); sem ele, nos testes automáticos, tudo fica como antes.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8942/index.html'; const PAIS = __dirname + '/ig3/paisagem.jpg';
const SH = __dirname + '/../qa/foco/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const shot = async (p, nome, o) => { await sleep(450); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: SH + 'depois-' + nome + '.png', ...(o || {}) }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const fecha = p => ev(p, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
const IND = { atualizado: '2026-11-02T17:54-03:00', itens: [
  { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,44', variacao: '-0,06%', dir: 'desce', data: '2026-11-02', serie: [5.07, 5.10, 5.14, 5.13, 5.12, 5.08, 5.20, 5.22, 5.18, 5.02, 4.98, 5.03, 5.10, 5.37, 5.35, 5.44], rotulos: ['2026-08-02', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2026-11-02'] },
  { id: 'selic', nome: 'Selic', valor: '15,00%', variacao: 'estável', dir: 'estavel', data: '2026-10-29', serie: [15, 15, 15, 15], rotulos: ['2026-07-30', '', '', '2026-10-29'] }] };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8942); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  for (const P of [A, B]) await P.addInitScript(() => { localStorage.setItem('prumo-teste-semreels', '1'); localStorage.setItem('prumo-teste-foco', '1') });
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, i => { IND_AUTO = i }, IND);
  for (const P of [A, B]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  await sleep(500);
  ok(await ev(A, () => FOCO_LIGADO === true && document.documentElement.classList.contains('foco')), 'modo foco ligado (estado de produção)');

  // ===== 1. listas
  const L = await ev(A, () => ({ figs: FG2_FIGS.map(f => f[0]), emo: FG2_EMOJIS.length, pen: FG2_PEN.map(p => p[0]), fontes: ED_FONTES.map(f => f[0]), filtros: ED_FILTROS.map(f => f[1]), reac: VS98_EMOS.join(''), com: VP99_EMOJIS.length, cores: ED_CORES.includes('#ff66c4') || ED_CORES.includes('#8338ec') }));
  ok(!['slid', 'add', 'hash', 'selfie'].some(k => L.figs.includes(k)) && ['nt', 'link', 'local', 'hora', 'enq', 'perg', 'quiz', 'men', 'cont', 'foto'].every(k => L.figs.includes(k)) && L.emo === 0, 'figurinhas: saem slider de emoji, "Adicione o seu", hashtag, selfie e os emojis; ficam as de notícia, perguntas, menção, contagem e foto', JSON.stringify(L));
  ok(L.pen.join() === 'caneta,mk,bor' && !L.fontes.includes('neon') && L.fontes.includes('jornal') && !L.cores, 'pincel sem Neon; texto sem Neon e com "Jornal"; sem rosa e roxo', JSON.stringify(L));
  ok(L.filtros.join() === 'Normal,Contraste,Suave,Claro,P&B' && L.reac === '👏👍🤔😮😢' && L.com === 6, 'filtros documentais (5) e reações rápidas sóbrias', JSON.stringify(L));

  // ===== 2. câmera do story
  await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer .ce-rail'), null, 6000); await sleep(600);
  const rail = await ev(A, () => [...document.querySelectorAll('#layer .ce-rail button')].map(b => b.querySelector('span').textContent.trim()));
  ok(rail.join() === 'Notícia,Texto,Indicador,Livre' && !(await A.$('#layer [data-edlayout],#layer [data-rcboom],#layer [data-rctimer]')), 'câmera: Notícia · Texto · Indicador · Livre (sem Layout, Boomerang e Timer)', rail.join());
  await shot(A, 'f01-camera');

  // ===== 3. cartão de texto
  await clk(A, '[data-fc105txt]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .fc105-cs') && [...document.querySelectorAll('[data-fc105k]')].map(b => b.textContent).join() === 'Opinião,Análise,Relato,Citação' && document.activeElement.id === 'fc105-tit'), 'Texto: folha do cartão (Opinião, Análise, Relato, Citação) com o título em foco');
  await A.keyboard.type('Reforma tributária: o que muda no seu bolso');
  await A.fill('#fc105-tx', 'A partir de 2027, cinco tributos viram dois. A cesta básica fica isenta e serviços de saúde e educação pagam 40% menos. O impacto real depende das alíquotas que o Senado ainda vai definir.');
  await A.fill('#fc105-fu', 'Agência Senado'); await sleep(400);
  ok(await ev(A, () => /Opinião de Pedro Brandão/.test(document.querySelector('.fc105-cr').textContent)), 'crédito automático: "Opinião de Pedro Brandão"');
  await shot(A, 'f02-cartao-folha');
  await clk(A, '[data-fc105k="ana"]'); await clk(A, '[data-fc105tema="papel"]'); await sleep(300);
  await clk(A, '[data-fc105csok]'); await esperar(A, () => ED && ED.st.bg.tipo === 'foto' && !!ED.st.bg.fc105, null, 5000); await sleep(400);
  ok(await ev(A, () => ED.tela === 'edit' && ED.st.bg.fc105.k === 'ana' && !!document.querySelector('#layer [data-fc105ed]') && !document.querySelector('#layer [data-edsemfoto]') && !document.querySelector('#layer .fc105-ctx') && !ED.st.els.length), 'Usar: o cartão vira o fundo do story, com "Editar cartão" (sem atalhos de foto)');
  await shot(A, 'f03-cartao-analise');
  await clk(A, '[data-fc105ed]'); await sleep(300);
  ok(await ev(A, () => document.querySelector('#fc105-tit').value === 'Reforma tributária: o que muda no seu bolso' && document.querySelector('[data-fc105k="ana"]').getAttribute('aria-selected') === 'true'), 'Editar cartão reabre com o que foi escrito');
  await clk(A, '[data-fc105k="cit"]'); await sleep(200);
  await A.fill('#fc105-tit', 'Ninguém vai pagar mais imposto com a reforma; o que muda é quem paga.'); await A.fill('#fc105-quem', 'Relator da reforma no Senado'); await A.fill('#fc105-fu', 'https://www12.senado.leg.br/noticias'); await clk(A, '[data-fc105tema="politica"]'); await sleep(300);
  await shot(A, 'f04-cartao-citacao-folha');
  await clk(A, '[data-fc105csok]'); await esperar(A, () => ED.st.bg.fc105 && ED.st.bg.fc105.k === 'cit', null, 5000); await sleep(400);
  ok(await ev(A, () => { const l = ED.st.els.filter(e => e.t === 'link'); return l.length === 1 && l[0].url === 'https://www12.senado.leg.br/noticias' && /senado\.leg\.br/i.test(l[0].tit) }), 'fonte com link vira a figurinha de link (dá para tocar), uma só');
  await shot(A, 'f05-cartao-citacao');
  const n0 = await ev(A, () => PUB.itens.length); await clk(A, '[data-edpubst="amigos"]'); await esperar(A, n => !ED && !PQ.atual && PUB.itens.length > n, n0, 20000); await sleep(500);
  ok(await ev(A, () => { const x = PUB.itens.find(y => y.tipo === 'story'); return x && /^Citação: Ninguém vai pagar mais imposto/.test(x.texto) && /Relator/.test(x.texto) && x.estilo.itens.some(i => i.t === 'link') }), 'story do cartão publicado, com o texto do cartão (busca e acessibilidade) e o link da fonte', await ev(A, () => JSON.stringify(PUB.itens.filter(y => y.tipo === 'story').map(y => y.texto))));

  // ===== 4. notícia pela câmera: fundo da editoria e "via Prumo"
  await esperar(A, () => !PQ.atual && !ED, null, 15000); await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer [data-cn102stnt]'), null, 6000); await sleep(300); await clk(A, '[data-cn102stnt]'); await sleep(300);
  const pid = await ev(A, () => { const p = ordenadas(visiveis()).find(q => secOf(q) === 'politica') || ordenadas(visiveis())[0]; return p.id });
  await clk(A, `[data-cn102stsel="${pid}"]`); await esperar(A, () => ED && ED.st.els.some(e => e.t === 'nt'), null, 5000); await sleep(500);
  ok(await ev(A, p => { const sec = secOf(pautaById(p)); return ED.st.bg.tipo === 'grad' && ED.st.bg.g === fc105FundoSec(sec) && getComputedStyle(document.querySelector('#ce-els .ce-nt'), '::after').content.includes('via Prumo') }, pid), 'Notícia: fundo sóbrio da editoria e "via Prumo" no cartão');
  await shot(A, 'f06-story-noticia');
  await fecha(A); await sleep(300);

  // ===== 5. indicador pela câmera
  await ev(A, () => criarAbrir('story')); await sleep(600); await clk(A, '[data-fc105ind]'); await sleep(400);
  ok(await ev(A, () => ED.tela === 'edit' && !!document.querySelector('#layer .cn102-dp') && ED.st.bg.g >= FC105_F0), 'Indicador: abre o painel do dado sobre um fundo sóbrio');
  await clk(A, '[data-cn102ind="dolar"]'); await sleep(150); await clk(A, '[data-cn102dok]'); await esperar(A, () => ED.st.els.some(e => e.cnd), null, 5000); await sleep(400);
  await shot(A, 'f07-story-indicador');
  await fecha(A); await sleep(300);

  // ===== 5b. relato em cartão (tema Noite) e Cancelar volta para a câmera
  await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer [data-fc105txt]'), null, 6000); await sleep(300); await clk(A, '[data-fc105txt]'); await sleep(300);
  await clk(A, '[data-fc105k="rel"]'); await sleep(200); await clk(A, '[data-fc105tema="noite"]'); await sleep(150);
  await A.fill('#fc105-tit', 'Árvore cai e bloqueia a Rua Voluntários da Pátria'); await A.fill('#fc105-tx', 'Caiu por volta das 14h, depois da ventania. Bombeiros já estão no local e o trânsito foi desviado pela São Clemente.'); await A.fill('#fc105-onde', 'Botafogo, Rio'); await sleep(700);
  ok(await ev(A, () => ED.tela === 'edit' && /url\("?data:image/.test(document.querySelector('#ce-cv .ce-bg').style.background) && /Relato de Pedro Brandão/.test(document.querySelector('.fc105-cr').textContent)), 'Relato: prévia ao vivo no próprio story e crédito "Relato de Pedro Brandão"');
  await shot(A, 'f07b-cartao-relato-folha');
  await clk(A, '[data-fc105csx]'); await sleep(400);
  ok(await ev(A, () => ED.tela === 'cam' && !!document.querySelector('#layer .ce-rail [data-fc105txt]') && !ED.st.bg.fc105), 'Cancelar volta para a câmera');
  await clk(A, '[data-fc105txt]'); await sleep(300); await clk(A, '[data-fc105k="rel"]'); await sleep(150); await clk(A, '[data-fc105tema="noite"]');
  await A.fill('#fc105-tit', 'Árvore cai e bloqueia a Rua Voluntários da Pátria'); await A.fill('#fc105-tx', 'Caiu por volta das 14h, depois da ventania. Bombeiros já estão no local e o trânsito foi desviado pela São Clemente.'); await A.fill('#fc105-onde', 'Botafogo, Rio');
  await clk(A, '[data-fc105csok]'); await esperar(A, () => ED.st.bg.fc105 && ED.st.bg.fc105.k === 'rel', null, 5000); await sleep(400);
  await shot(A, 'f07c-cartao-relato');
  await fecha(A); await sleep(300);

  // ===== 6. foto: atalhos de contexto
  await ev(A, () => criarAbrir('story')); await sleep(600); await A.setInputFiles('#ce-file', [PAIS]); await esperar(A, () => ED.tela === 'edit' && ED.st.bg.tipo === 'foto', null, 6000); await sleep(500);
  ok(await ev(A, () => [...document.querySelectorAll('#layer .fc105-ctx [data-fc105ctx]')].map(b => b.dataset.fc105ctx).join() === 'local,hora,link,nt'), 'foto: atalhos de contexto (Local, Hora, Fonte, Notícia)');
  await shot(A, 'f08-foto-contexto');
  await clk(A, '[data-fc105ctx="hora"]'); await sleep(300);
  ok(await ev(A, () => ED.st.els.some(e => e.t === 'hora') && !document.querySelector('[data-fc105ctx="hora"]')), 'Hora entra no story e o atalho some');
  await clk(A, '[data-fc105ctx="local"]'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .ce-fe') || !!document.querySelector('#layer .ce-sel')), 'Local abre o editor da figurinha');
  await A.keyboard.type('Av. Brasil, Rio'); await sleep(200); await ev(A, () => document.querySelector('#layer [data-edfok],#layer .ce-sel .btn:not(.ghost)')?.click()); await sleep(400);
  await shot(A, 'f09-foto-com-local-hora');

  // ===== 7. bandeja, texto e pincel
  await clk(A, '.ce-top [data-edfig]'); await sleep(450);
  ok(await ev(A, () => { const v = [...document.querySelectorAll('.ce-fig [data-edfig]')].map(b => b.dataset.edfig); const hs = [...document.querySelectorAll('.ce-fig .cn102-fh')].map(h => h.textContent); return !v.some(k => ['slid', 'add', 'hash', 'selfie'].includes(k)) && !document.querySelector('.ce-fig [data-edemo]') && hs.join() === 'Notícia e contexto,Perguntar,Mais' && document.querySelector('#ce-figq').placeholder === 'Buscar figurinhas' && getComputedStyle(document.querySelector('#fg2-hemo')).display === 'none' }), 'bandeja: Notícia e contexto · Perguntar · Mais, sem emojis');
  await shot(A, 'f10-bandeja');
  await ev(A, () => document.querySelector('.ce-fig')?.remove());
  await clk(A, '.ce-top [data-edtexto]'); await sleep(400);
  ok(await ev(A, () => [...document.querySelectorAll('#layer .ce-tx [data-edtxf]')].map(b => b.textContent).join() === 'Clássico,Jornal,Itálico,Forte,Máquina' && getComputedStyle(document.querySelector('#layer .ce-tx [data-edtxan]')).display === 'none'), 'texto: Clássico, Jornal, Itálico, Forte, Máquina; sem botão de animação');
  await clk(A, '[data-edtxf="jornal"]'); await A.keyboard.type('Trânsito parado desde as 7h'); await sleep(200);
  await shot(A, 'f11-texto-jornal');
  await ev(A, () => edTextoOk()); await sleep(200);
  await clk(A, '.ce-top [data-edcaneta]'); await sleep(400);
  ok(await ev(A, () => [...document.querySelectorAll('#layer [data-edcnt]')].map(b => b.dataset.edcnt).join() === 'caneta,mk,bor'), 'pincel: caneta, marcador e borracha');
  await fecha(A); await sleep(300);

  // ===== 8. stories antigos com figurinhas que saíram continuam aparecendo; reações sóbrias
  await ev(B, async () => { const now = Date.now(); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now, expira: now + 864e5, texto: '', fotos: [], publico: 'amigos',
    estilo: { v: 2, itens: [{ t: 'slid', q: 'Quanto você confia nas pesquisas?', emo: '😍', x: .5, y: .3, s: 1, r: 0 }, { t: 'add', q: 'Mostre a sua rua', x: .5, y: .62, s: .9, r: 0 }] } }) });
  await ev(A, () => { go('feed'); pubCarregar() }); await esperar(A, () => document.querySelectorAll('#secs [data-ustory]').length >= 1, null, 8000); await ev(A, () => scrollTo(0, 0)); await sleep(400);
  await ev(A, () => document.querySelector('#secs [data-ustory] .ig-r').click()); await esperar(A, () => !!document.querySelector('#layer .story.sg-user'), null, 6000); await sleep(700);
  ok(await ev(A, () => { const s = document.querySelector('#layer .story'); return /Quanto você confia nas pesquisas/.test(s.textContent) && /Mostre a sua rua/.test(s.textContent) }), 'story antigo com slider de emoji e "Adicione o seu" continua aparecendo');
  ok(await ev(A, () => [...document.querySelectorAll('#layer .vs98-reac button')].map(b => b.dataset.vs98reac).join('') === '👏👍🤔😮😢'), 'reações rápidas do story: 👏 👍 🤔 😮 😢');
  await shot(A, 'f16-story-antigo');
  { const r = await ev(A, () => { const b = document.querySelector('#layer .us-rp input').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } }); await A.touchscreen.tap(r.x, r.y); await sleep(600); await shot(A, 'f17-story-reacoes') }
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 9. post: regra da casa e pedido de fonte na análise
  await ev(A, () => criarAbrir('post')); await sleep(400); await clk(A, '[data-cn102ini="ana"]'); await sleep(300);
  ok(await ev(A, () => /Discuta as ideias, com respeito às pessoas/.test(document.querySelector('.cn102-aviso').textContent) && /recomendado/.test(document.querySelector('#cn102-fu').placeholder)), 'post: "Discuta as ideias, com respeito às pessoas" e fonte recomendada');
  await A.keyboard.type('Juros altos seguram o crédito'); await A.fill('#ce-leg', 'Com a Selic em 15%, o crédito para empresas cresceu 2% em doze meses, o menor ritmo desde 2017.');
  const np = await ev(A, () => PUB.itens.filter(x => x.tipo === 'post').length);
  await clk(A, '[data-edpubpo]'); await sleep(500);
  ok(await ev(A, n => !!ED && !PQ.atual && PUB.itens.filter(x => x.tipo === 'post').length === n && !!document.querySelector('#layer .fc105-pedet') && !!document.querySelector('#layer .ce-row.fc105-pede'), np), 'análise sem fonte: o primeiro Publicar pede a fonte (sem publicar)');
  await shot(A, 'f12-analise-pede-fonte');
  await clk(A, '[data-edpubpo]'); await esperar(A, n => !ED && !PQ.atual && PUB.itens.filter(x => x.tipo === 'post').length === n + 1, np, 20000); await sleep(400);
  ok(await ev(A, n => PUB.itens.filter(x => x.tipo === 'post').length === n + 1, np), 'tocar de novo publica assim mesmo');

  // ===== 10. matéria: comentar a notícia
  await ev(A, p => abrirMateria(p), pid); await sleep(700);
  ok(await ev(A, p => { const m = document.querySelector('#layer .fc105-mc'); return m && m.querySelector(`[data-cn102envp="${p}"]`) && m.querySelector(`[data-cn102envs="${p}"]`) }, pid), 'matéria: "O que você acha?" com Publicar comentário e No story');
  await ev(A, () => document.querySelector('#layer .fc105-mc').scrollIntoView({ block: 'center' })); await sleep(300);
  await shot(A, 'f13-materia-comentar');
  await ev(A, () => document.querySelector('#layer .fc105-mc [data-cn102envp]').click()); await esperar(A, () => ED && ED.po && ED.po.cn && ED.po.cn.k === 'nt', null, 5000); await sleep(400);
  ok(await ev(A, p => ED.po.pid === p && !!document.querySelector('#layer .cn102-ntc'), pid), 'Publicar comentário abre "Comentar notícia" com a notícia escolhida');
  await shot(A, 'f14-comentar-noticia');
  await fecha(A); await sleep(300);
  await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(500); await shot(A, 'f15-feed');

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  await b.close(); srv.kill(); const R = U.resumo(); console.log(`\nRESUMO t_foco_noticia: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
