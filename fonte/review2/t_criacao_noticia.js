// Criação com foco em notícia: começos de conteúdo, notícia comentada, relato, análise com dado, pergunta, story com notícia e indicador
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8981/index.html'; const PAIS = __dirname + '/ig3/paisagem.jpg', RET = __dirname + '/ig3/retrato.jpg';
const SH = __dirname + '/../shots-ig9/'; require('fs').mkdirSync(SH, { recursive: true }); for (const f of require('fs').readdirSync(SH)) if (/\.png$/.test(f)) require('fs').unlinkSync(SH + f);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
let N = 0; const shot = async (p, nome, full) => { await sleep(300); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: SH + String(++N).padStart(2, '0') + '-' + nome + '.png' }) };
const shotEl = async (p, sel, nome) => { await sleep(900); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); const el = await p.$(sel); if (!el) { ok(false, 'captura: não achei ' + sel); return } await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: SH + String(++N).padStart(2, '0') + '-' + nome + '.png', clip: await ev(p, s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top), width: 390, height: Math.min(844 - Math.max(0, r.top), r.height) } }, sel) }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const IND = { atualizado: '2026-11-02T17:54-03:00', itens: [
  { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,44', variacao: '-0,06%', dir: 'desce', data: '2026-11-02', serie: [5.07, 5.10, 5.14, 5.13, 5.12, 5.08, 5.20, 5.22, 5.18, 5.02, 4.98, 5.03, 5.10, 5.37, 5.35, 5.44], rotulos: ['2026-08-02', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '2026-11-02'] },
  { id: 'selic', nome: 'Selic', valor: '15,00%', variacao: 'estável', dir: 'estavel', data: '2026-10-29', serie: [15, 15, 15, 15], rotulos: ['2026-07-30', '', '', '2026-10-29'] },
  { id: 'ipca12m', nome: 'IPCA 12 meses', valor: '5,17%', variacao: '+0,12 p.p.', dir: 'sobe', data: '2026-10-10', serie: [4.8, 4.9, 5.0, 5.05, 5.17], rotulos: ['2026-06', '', '', '', '2026-10'] }] };
async function publicaPost(p) { const n0 = await ev(p, () => PUB.itens.filter(x => x.tipo === 'post').length); await clk(p, '[data-edpubpo]'); await esperar(p, n => !ED && !PQ.atual && PUB.itens.filter(x => x.tipo === 'post').length === n + 1, n0, 20000); await sleep(500); return ev(p, () => PUB.itens.filter(x => x.tipo === 'post')[0]) }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8981); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid), uidA = await ev(A, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, i => { IND_AUTO = i }, IND);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(500);

  // ===== 0. no Feed, uma linha para publicar conteúdo sem passar pela galeria
  ok(await ev(A, () => { const b = document.querySelector('#cn102-bar'); return b && !b.hidden && b.previousElementSibling && b.previousElementSibling.id === 'secs' }), 'Feed: linha "Comente uma notícia ou conte o que viu…" logo abaixo dos stories');
  await shot(A, 'feed-linha-publicar');
  const [fc0] = await Promise.all([A.waitForEvent('filechooser', { timeout: 1500 }).catch(() => null), clk(A, '#cn102-bar [data-cn102bar]')]); await sleep(400);
  ok(!fc0 && await ev(A, () => ED && ED.modo === 'post' && document.querySelectorAll('#layer [data-cn102ini]').length === 4), 'tocar na linha abre os começos de conteúdo sem abrir a galeria');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer() }); await sleep(300);

  // ===== 1. o + continua abrindo a galeria, e atrás dela o criador começa pelo conteúdo
  const [fc] = await Promise.all([A.waitForEvent('filechooser', { timeout: 2500 }).catch(() => null), clk(A, '#b-criar')]);
  ok(!fc, 'o + abre direto em "O que você quer publicar?" (sem abrir a galeria)');
  ok(await ev(A, () => { const ks = [...document.querySelectorAll('#layer [data-cn102ini]')].map(b => b.dataset.cn102ini); return ks.join() === 'nt,rel,ana,enq' && !!document.querySelector('#layer .ce-big') && !!document.querySelector('#layer [data-edsotexto]') }), 'criador vazio: Comentar notícia, Aconteceu perto de mim, Minha análise, Pergunte aos amigos (+ Só texto)');
  await shot(A, 'criador-comeca-pelo-conteudo');

  // ===== 2. Minha análise: título, texto, indicador da edição, fonte
  await clk(A, '[data-cn102ini="ana"]'); await sleep(400);
  ok(await ev(A, () => ED.po.cn && ED.po.cn.k === 'ana' && !!document.querySelector('#layer .cn102 #cn102-tit') && document.activeElement.id === 'cn102-tit' && /Análise/.test(document.querySelector('.ce-ph b').textContent)), 'Minha análise: formulário com título em foco');
  await A.keyboard.type('Dólar volta a subir e pressiona a inflação');
  await A.fill('#ce-leg', 'A alta do dólar nas últimas semanas encarece importados e combustíveis. Se continuar, o IPCA de novembro deve vir acima do previsto pelo mercado, e o Banco Central fica sem espaço para cortar a Selic.');
  await clk(A, '[data-cn102dado]'); await sleep(300);
  ok(await ev(A, () => document.querySelectorAll('#layer .cn102-dp [data-cn102ind]').length === 3 && !!document.querySelector('#layer .cn102-dpv svg')), 'painel do dado: indicadores da edição com prévia do gráfico');
  await shot(A, 'analise-painel-indicador');
  await clk(A, '[data-cn102ind="dolar"]'); await sleep(150); await clk(A, '[data-cn102dok]'); await sleep(300);
  ok(await ev(A, () => ED.po.cn.d && ED.po.cn.d.tipo === 'ind' && ED.po.cn.d.val === 'R$ 5,44' && !!document.querySelector('#layer .cn102-dprev svg')), 'indicador escolhido aparece no formulário');
  await A.fill('#cn102-fu', 'https://www.bcb.gov.br/estatisticas');
  await shot(A, 'analise-formulario');
  const pa = await publicaPost(A);
  ok(pa.estilo.cn && pa.estilo.cn.k === 'ana' && pa.estilo.cn.tit === 'Dólar volta a subir e pressiona a inflação' && pa.estilo.cn.d.tipo === 'ind' && pa.estilo.cn.fu === 'https://www.bcb.gov.br/estatisticas' && /^Dólar volta a subir e pressiona a inflação\n\nA alta/.test(pa.texto), 'publicado: estilo.cn {k:ana, tit, d, fu} e texto "título + corpo" (compatível)');
  await ev(A, () => scrollTo(0, 0)); await sleep(300);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-ana'); return a && /Opinião/.test(a.querySelector('.ph-sub').textContent) && /Opinião de Pedro Brandão/.test(a.querySelector('.cn102-k').textContent) && a.querySelectorAll('.track > .sl').length === 2 && !!a.querySelector('.cn102-dsl svg') && !!a.querySelector('a.cn102-fonte[href^="https://www.bcb.gov.br"]') }), 'Feed: rótulo Opinião, cartão "Opinião de Pedro Brandão", slide do gráfico e link da fonte');
  await shotEl(A, '#posts .upost.cn102-ana', 'feed-analise');
  await ev(A, () => { const t = document.querySelector('#posts .upost.cn102-ana .track'); t.scrollLeft = t.clientWidth }); await sleep(300);
  await shotEl(A, '#posts .upost.cn102-ana', 'feed-analise-grafico');

  // ===== 3. análise com os próprios números (barras)
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-cn102ini="ana"]'); await sleep(300);
  await A.keyboard.type('Quanto cada estado recebeu');
  await clk(A, '[data-cn102dado]'); await sleep(200); await clk(A, '[data-cn102dab="meu"]'); await sleep(200);
  await A.fill('[data-cn102dp="tit"]', 'Repasse por estado'); await A.fill('[data-cn102dp="un"]', 'R$ bi');
  const lin = [['SP', '12,5'], ['RJ', '8,1'], ['MG', '7,3'], ['PR', '4,9']];
  for (let i = 0; i < lin.length; i++) { if (i > 2) { await clk(A, '[data-cn102lmais]'); await sleep(100) } await A.fill(`[data-cn102r="${i}"]`, lin[i][0]); await A.fill(`[data-cn102v="${i}"]`, lin[i][1]) }
  await sleep(200); ok(await ev(A, () => document.querySelectorAll('#layer .cn102-dpv rect.cn102-g-b').length === 4), 'meus números: 4 barras na prévia');
  await shot(A, 'analise-meus-numeros');
  await clk(A, '[data-cn102dok]'); await sleep(200);
  const pb = await publicaPost(A);
  ok(pb.estilo.cn.d.tipo === 'bar' && pb.estilo.cn.d.s.join() === '12.5,8.1,7.3,4.9' && pb.estilo.cn.d.r.join() === 'SP,RJ,MG,PR' && pb.texto === 'Quanto cada estado recebeu', 'números em pt-BR viram dados do gráfico');
  await ev(A, () => scrollTo(0, 0)); await sleep(300);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-ana'); return a && a.querySelectorAll('.track > .sl').length === 1 && a.querySelectorAll('.cn102-dmini rect.cn102-g-b').length === 4 }), 'análise só com título e gráfico: um cartão com o gráfico dentro');
  await shotEl(A, '#posts .upost.cn102-ana', 'feed-analise-barras');

  // ===== 4. Aconteceu perto de mim: foto, título, onde, quando, fonte
  await ev(A, () => criarAbrir('post')); await sleep(300);
  const [fc2] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '[data-cn102ini="rel"]')]);
  ok(!!fc2 && fc2.isMultiple(), 'Relato: já abre a galeria para a foto');
  await fc2.setFiles([PAIS, RET]); await esperar(A, () => ED.po.fotos.length === 2, null, 6000); await sleep(400);
  ok(await ev(A, () => document.activeElement.id === 'cn102-tit' && document.querySelectorAll('#layer .cn102-fts canvas').length === 2 && /T\d\d:\d\d/.test(document.querySelector('#cn102-q').value)), 'fotos na faixa, título em foco e "quando" já com agora');
  await A.keyboard.type('Árvore cai e bloqueia a Rua Voluntários da Pátria');
  await A.fill('#ce-leg', 'Caiu por volta das 14h, depois da ventania. Bombeiros já estão no local e o trânsito foi desviado pela São Clemente.');
  await A.fill('#ce-local', 'Botafogo, Rio'); await A.fill('#cn102-q', '2026-11-02T14:10'); await A.fill('#cn102-fu', 'Defesa Civil do Rio');
  await shot(A, 'relato-formulario');
  const pr = await publicaPost(A);
  ok(pr.estilo.cn.k === 'rel' && pr.estilo.cn.q === '2026-11-02T14:10' && pr.estilo.cn.fu === 'Defesa Civil do Rio' && pr.estilo.local === 'Botafogo, Rio' && pr.fotos.length === 2, 'relato publicado: fotos, local no estilo de sempre, quando e fonte no cn');
  await ev(A, () => scrollTo(0, 0)); await sleep(400);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-rel'); return a && /De perto/.test(a.querySelector('.ph-sub').textContent) && /Árvore cai/.test(a.querySelector('.cn102-lt').textContent) && /Botafogo, Rio · /.test(a.querySelector('.cn102-lm').textContent) && /Fonte: Defesa Civil do Rio/.test(a.textContent) && a.querySelectorAll('.track .up-img').length === 2 && !/Árvore cai/.test(a.querySelector('.up-leg').textContent) }), 'Feed: rótulo De perto (antes Relato), título e "onde · quando" na legenda, fotos e fonte (sem repetir o título)');
  await shotEl(A, '#posts .upost.cn102-rel', 'feed-relato-com-foto');
  await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-rel'); a.scrollIntoView({ block: 'end' }) }); await sleep(300); await shot(A, 'feed-relato-legenda');
  // relato sem foto
  await ev(A, () => criarAbrir('post')); await sleep(300); await ev(A, () => { CN102_SEMGAL = 1 }); await clk(A, '[data-cn102ini="rel"]').catch(() => {}); await sleep(300);
  await ev(A, () => { CN102_SEMGAL = 0; document.querySelector('#cn102-file')?.remove() });
  await A.fill('#cn102-tit', 'Falta de luz no Centro desde as 9h'); await A.fill('#ce-local', 'Centro, Curitiba'); await A.fill('#ce-leg', 'Vários prédios da Rua XV sem energia. A Copel diz que equipes já trabalham no conserto.');
  const pr2 = await publicaPost(A);
  await ev(A, () => scrollTo(0, 0)); await sleep(400);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-rel'); return a && a.querySelector('.cn102-rel .cn102-cd h3')?.textContent === 'Falta de luz no Centro desde as 9h' && /De perto · Pedro Brandão/.test(a.textContent) && /Centro, Curitiba/.test(a.querySelector('.cn102-meta').textContent) }), 'relato sem foto vira cartão com título, onde e quando');
  await shotEl(A, '#posts .upost.cn102-rel', 'feed-relato-sem-foto');


  // ===== 5. Pergunte aos amigos: pergunta, opções, sobre a notícia
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-cn102ini="enq"]'); await sleep(300);
  await A.keyboard.type('O Senado deve aprovar o fim da escala 6x1?');
  await A.fill('[data-cn102o="0"]', 'Sim, já'); await A.fill('[data-cn102o="1"]', 'Não'); await clk(A, '[data-cn102omais]'); await sleep(150); await A.keyboard.type('Com transição');
  await clk(A, '.cn102 [data-edsont]'); await sleep(300);
  ok(await ev(A, () => document.querySelectorAll('#layer .cn102-ntl [data-edpnt] .cn102-th').length > 5), 'lista de notícias da edição com a arte de cada uma');
  await shot(A, 'lista-noticias');
  await A.fill('#ce-lq', '6x1'); await sleep(150); ok(await ev(A, () => [...document.querySelectorAll('#layer .cn102-ntl li')].filter(l => !l.hidden).length === 1), 'busca na lista de notícias');
  await clk(A, '[data-edpnt="pec-6x1-senado"]'); await sleep(300);
  ok(await ev(A, () => ED.po.cn.k === 'enq' && ED.po.pid === 'pec-6x1-senado' && /Senado vota/.test(document.querySelector('.cn102 [data-edsont] em').textContent)), 'pergunta ligada à notícia');
  await shot(A, 'pergunta-formulario');
  const pq = await publicaPost(A);
  ok(pq.estilo.cn.k === 'enq' && pq.estilo.cn.o.join('|') === 'Sim, já|Não|Com transição' && pq.pid === 'pec-6x1-senado', 'pergunta publicada com 3 opções e a notícia');
  await ev(A, () => scrollTo(0, 0)); await sleep(400);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-enq'); return a && a.querySelectorAll('.track > .sl').length === 1 && a.querySelectorAll('.cn102-eo').length === 3 && !!a.querySelector('.cn102-sobre[data-capmat="pec-6x1-senado"]') }), 'Feed: a pergunta é o cartão (opções + link da notícia), sem slide extra');
  await shotEl(A, '#posts .upost.cn102-enq', 'feed-pergunta-autor');
  const idQ = pq.id;

  // ===== 6. notícia da edição pelo Enviar: publicar com comentário
  await ev(A, () => { const b = document.querySelector('#posts .post:not(.upost) [data-a="send"]'); b.scrollIntoView({ block: 'center' }); b.click() }); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.sheet .cn102-env [data-cn102envp]') && !!document.querySelector('.sheet .cn102-env [data-cn102envs]')), 'Enviar de uma notícia: "Publicar com comentário" e "No seu story"');
  await shot(A, 'enviar-noticia');
  const pidN = await ev(A, () => document.querySelector('.sheet [data-cn102envp]').dataset.cn102envp);
  await clk(A, '.sheet [data-cn102envp]'); await sleep(600);
  ok(await ev(A, p => ED && ED.po.cn.k === 'nt' && ED.po.pid === p && !!document.querySelector('#layer .cn102-ntc') && document.activeElement.id === 'ce-leg', pidN), 'abre o post já com a notícia e o cursor no comentário (sem galeria)');
  await A.keyboard.type('Importante acompanhar: muda a rotina de muita gente.');
  await shot(A, 'noticia-comentada-formulario');
  const pn = await publicaPost(A);
  ok(pn.pid === pidN && pn.estilo.cn.k === 'nt' && pn.texto === 'Importante acompanhar: muda a rotina de muita gente.' && pn.snap && pn.snap.titulo, 'notícia comentada publicada (pid + snap + comentário)');
  await ev(A, () => scrollTo(0, 0)); await sleep(400);
  ok(await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-nt'); return a && !!a.querySelector('.cn102-ntb .cn102-nta') && /via Prumo/.test(a.textContent) && /Importante acompanhar/.test(a.querySelector('.up-leg').textContent) }), 'Feed: cartão da notícia com a arte da edição e "via Prumo", comentário na legenda');
  await shotEl(A, '#posts .upost.cn102-nt', 'feed-noticia-comentada');
  // pelo criador (o caminho de antes continua: Notícia do Prumo → escolher → legenda)
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-edsont]'); await sleep(300); await clk(A, '[data-edpnt]'); await sleep(300);
  ok(await ev(A, () => ED.po.cn && ED.po.cn.k === 'nt' && !!document.querySelector('#ce-leg') && !!document.querySelector('[data-cn102nst]')), 'pelo criador: escolher a notícia leva ao mesmo formulário (com o atalho para o story)');
  await A.fill('#ce-leg', 'Vale ler.');
  // ===== 7. do formulário para o story: notícia + o comentário
  await clk(A, '[data-cn102nst]'); await esperar(A, () => ED && ED.modo === 'story' && ED.tela === 'edit' && ED.st.els.some(e => e.t === 'nt'), null, 5000); await sleep(400);
  ok(await ev(A, () => ED.st.els.some(e => e.t === 'texto' && e.tx === 'Vale ler.')), 'story com a notícia e o comentário como texto');
  await shot(A, 'story-noticia-com-comentario');
  { const n0 = await ev(A, () => pubStoriesDe(S.uid).length); await clk(A, "[data-edpubst='amigos']"); await esperar(A, n => !ED && !PQ.atual && pubStoriesDe(S.uid).length === n + 1, n0, 20000); await sleep(400) }
  ok(await ev(A, () => pubStoriesDe(S.uid).slice(-1)[0].estilo.itens.some(i => i.t === 'nt')), 'story publicado com a figurinha da notícia (tocável)');

  // ===== 8. story: "Notícia" na câmera, bandeja de notícia primeiro e figurinha de indicador
  await ev(A, () => criarAbrir('story')); await sleep(500);
  ok(await ev(A, () => { const r = [...document.querySelectorAll('#layer .ce-rail > button')].map(b => (b.querySelector('span')?.textContent || '').trim()); return r[0] === 'Criar' && r[1] === 'Notícia' }), 'câmera do story: "Notícia" logo abaixo de "Criar"');
  await shot(A, 'story-camera-noticia');
  await clk(A, '[data-cn102stnt]'); await sleep(300); await clk(A, '#layer [data-cn102stsel]'); await sleep(500);
  ok(await ev(A, () => ED.tela === 'edit' && ED.st.els.filter(e => e.t === 'nt').length === 1), 'escolher a notícia abre o editor com o cartão da notícia');
  await clk(A, '.ce-top [data-edfig]'); await sleep(400);
  ok(await ev(A, () => { const k = [...document.querySelectorAll('.ce-fig .fg2-chips > *')].map(e => e.dataset.edfig || ('#' + e.textContent)); return k.slice(0, 9).join() === '#Notícia e contexto,nt,link,local,hora,ind,enq,perg,quiz' && k[9] === '#Pessoas e diversão' && /Fonte/.test(document.querySelector('.ce-fig [data-edfig="link"]').textContent) }), 'bandeja: Notícia e contexto primeiro (Notícia, Fonte/link, Local, Hora, Indicador, Enquete…), diversão depois');
  await shot(A, 'story-bandeja');
  await A.fill('#ce-figq', 'selic'); await sleep(150); ok(await ev(A, () => [...document.querySelectorAll('.ce-fig [data-edfig]')].filter(b => !b.hidden).map(b => b.dataset.edfig).join() === 'ind' && [...document.querySelectorAll('.ce-fig .cn102-fh')].every(h => h.hidden)), 'busca "selic" acha o Indicador');
  await A.fill('#ce-figq', ''); await sleep(100);
  await clk(A, '.ce-fig [data-edfig="ind"]'); await sleep(300); await clk(A, '[data-cn102ind="ipca12m"]'); await sleep(150); await clk(A, '[data-cn102dok]'); await esperar(A, () => ED.st.els.some(e => e.t === 'img' && e.cnd), null, 5000); await sleep(400);
  ok(await ev(A, () => { const e = ED.st.els.find(x => x.t === 'img' && x.cnd); const n = document.querySelector(`#ce-els [data-eid="${e.id}"] img`); return n && n.naturalWidth === 960 }), 'figurinha do indicador: cartão em imagem no story');
  await shot(A, 'story-indicador');
  { const n0 = await ev(A, () => pubStoriesDe(S.uid).length); await clk(A, "[data-edpubst='amigos']"); await esperar(A, n => !ED && !PQ.atual && pubStoriesDe(S.uid).length === n + 1, n0, 20000); await sleep(400) }

  // ===== 9. a Bia vê, vota na pergunta e o Pedro vê o resultado
  await ev(B, () => go('feed')); await esperar(B, () => PUB.on === true, null, 8000); await ev(B, () => pubCarregar()); await esperar(B, id => !!pubDe(id), idQ, 8000); await sleep(800);
  ok(await ev(B, () => { const l = PUB.itens.filter(x => x.tipo === 'post' && x.estilo && x.estilo.cn); const ks = l.map(x => (pubPostHTML(x).match(/cn102-post cn102-(\w+)/) || [])[1]).sort().join(); return ks === 'ana,ana,enq,nt,rel,rel' && !!document.querySelector('#posts .upost.cn102-enq') }), 'a Bia vê os 6 posts com os cartões de cada tipo');
  await shotEl(B, '#posts .upost.cn102-enq', 'bia-pergunta-antes');
  await ev(B, () => { const b = document.querySelector('#posts .upost.cn102-enq [data-cn102voto="2"]'); b.scrollIntoView({ block: 'center' }) }); await sleep(200);
  await clk(B, '#posts .upost.cn102-enq [data-cn102voto="2"]'); await sleep(900);
  ok(await ev(B, id => meuVoto('us:' + id + '#p') === 2 && /100%/.test(document.querySelector('#posts .upost.cn102-enq .cn102-eo.mine').textContent), idQ), 'a Bia vota em "Com transição" e vê 100%');
  await shotEl(B, '#posts .upost.cn102-enq', 'bia-pergunta-votou');
  await ev(A, () => psCarregar()); await sleep(800); await ev(A, () => renderPosts && renderPosts(true)).catch(() => {}); await sleep(400);
  ok(await ev(A, id => { const e = document.querySelector(`.cn102-enq[data-cn102enq="${id}"]`); return e && /Bia/.test(e.textContent) && /1 voto/.test(e.textContent) }, idQ), 'o Pedro vê o voto da Bia');

  // modo escuro: os cartões seguem o tema
  await B.emulateMedia({ colorScheme: 'dark' }); await sleep(400);
  await shotEl(B, '#posts .upost.cn102-enq', 'bia-escuro-pergunta');
  ok(await ev(B, () => getComputedStyle(document.querySelector('#posts .upost.cn102-enq .cn102-enqsl')).backgroundColor !== 'rgb(255, 255, 255)'), 'modo escuro: cartão da pergunta no fundo escuro');
  await ev(B, id => { const x = pubDe(id); const d = document.createElement('div'); d.id = 'cn102-teste'; d.innerHTML = pubPostHTML(x); document.querySelector('#posts').prepend(d) }, (await ev(A, () => PUB.itens.find(x => x.estilo && x.estilo.cn && x.estilo.cn.k === 'ana' && x.estilo.cn.d && x.estilo.cn.d.tipo === 'ind').id)));
  await ev(B, () => scrollTo(0, 0)); await sleep(300); await shotEl(B, '#cn102-teste .upost', 'bia-escuro-analise');
  await ev(B, () => { const t = document.querySelector('#cn102-teste .track'); t.scrollLeft = t.clientWidth }); await shotEl(B, '#cn102-teste .upost', 'bia-escuro-grafico');
  await ev(B, () => document.querySelector('#cn102-teste').remove()); await B.emulateMedia({ colorScheme: 'light' });

  // editar a legenda de um relato: o título fica
  const idRel = pr2.id;
  await ev(A, id => { const b = document.createElement('button'); b.dataset.ueditar = id; document.body.appendChild(b); b.click(); b.remove() }, idRel); await sleep(500);
  ok(await ev(A, () => document.querySelector('#ed-leg')?.value === 'Vários prédios da Rua XV sem energia. A Copel diz que equipes já trabalham no conserto.' && /Título: Falta de luz/.test(document.querySelector('.cn102-edt')?.textContent || '')), 'editar legenda mostra só o texto (o título aparece fixo em cima)');
  await A.fill('#ed-leg', 'Vários prédios sem energia. A luz voltou às 13h.'); await clk(A, '[data-uedok]'); await sleep(900);
  ok(await ev(A, id => pubDe(id).texto === 'Falta de luz no Centro desde as 9h\n\nVários prédios sem energia. A luz voltou às 13h.', idRel), 'salvar recompõe "título + texto"');

  // ===== 10. post antigo com notícia (sem cn) ganha o cartão novo; dado inválido de outro membro é ignorado
  ok(await ev(A, () => { const h = pubPostHTML({ id: '31111111-1111-1111-1111-111111111111', autor: S.uid, tipo: 'post', at: Date.now(), texto: 'Antigo', fotos: [], pid: 'pec-6x1-senado', estilo: { v: 2 } }); return /cn102-ntb/.test(h) && /data-capmat="pec-6x1-senado"/.test(h) && /via Prumo/.test(h) }), 'post antigo com notícia: cartão novo, mesmo toque para a matéria');
  ok(await ev(A, () => { const h = pubPostHTML({ id: '41111111-1111-1111-1111-111111111111', autor: S.uid, tipo: 'post', at: Date.now(), texto: 'x', fotos: [], estilo: { v: 2, cn: { k: 'ana', tit: '<img src=x onerror=alert(1)>', fu: 'javascript:alert(1)', d: { tipo: 'bar', s: ['a', 1e99] } } } }); return !/<img src=x/.test(h) && !/href="javascript/.test(h) && !/cn102-g/.test(h) && /cn102-ana/.test(h) }), 'dados de outro membro são limpos (sem HTML, sem link perigoso, gráfico inválido some)');
  ok(await ev(A, () => { const h = pubPostHTML({ id: '51111111-1111-1111-1111-111111111111', autor: S.uid, tipo: 'post', at: Date.now(), texto: 'x', fotos: [], estilo: { v: 2, cn: { k: 'zzz' } } }); return /up-tx/.test(h) && !/cn102/.test(h) }), 'tipo desconhecido: o post aparece como antes');

  // ===== 11. rascunho guarda o tipo
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-cn102ini="ana"]'); await sleep(300); await A.keyboard.type('Rascunho de análise'); await A.fill('#ce-leg', 'Texto ainda pela metade');
  await clk(A, '[data-edfechar], .ce-ph [data-edvolta]').catch(() => {}); await sleep(300);
  await ev(A, async () => { await rascSalva(); ED = null; closeLayer._ok = true; closeLayer() }); await sleep(300);
  await ev(A, () => criarAbrir('post')); await sleep(600); await clk(A, '[data-edrascs]'); await sleep(300); await clk(A, '[data-edrasc]'); await sleep(600);
  ok(await ev(A, () => ED.po.cn && ED.po.cn.k === 'ana' && document.querySelector('#cn102-tit').value === 'Rascunho de análise' && document.querySelector('#ce-leg').value === 'Texto ainda pela metade'), 'rascunho reabre no formulário da análise');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer() });

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).slice(0, 4).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_criacao_noticia: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
