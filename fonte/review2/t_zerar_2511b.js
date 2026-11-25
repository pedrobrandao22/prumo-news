// 25/11 (lote 5): seguidores › perfil › voltar reabre a lista; Enter duplo para sair da citação não deixa linha vazia;
// post com foto embaixo da própria notícia sem o quadro repetido. Porta 9433.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9433, BASE = `http://localhost:${PORTA}/index.html`;
async function pfEstado(P, seguir) {
  await P.evaluate(seguir => {
    const T = Date.now(), H = 36e5, D = 864e5, p0 = FEED.pautas[0], p1 = FEED.pautas[1], p2 = FEED.pautas[2];
    S.uid = 'u-pedro'; S.user = { id: 'u-pedro', email: 'pedro@x.com' }; S.email = 'pedro@x.com'; S.membro = true; S.amigosOk = true;
    S.membros = { 'u-pedro': { nome: 'Pedro' }, 'u-bia': { nome: 'Bia Souza' }, 'u-caio': { nome: 'Caio Lima' }, 'u-dora': { nome: 'Dora Reis' }, 'u-edu': { nome: 'Edu Prado' } };
    S.amigos = new Set(['u-bia', 'u-caio']); S.pedidosIn = ['u-edu']; S.pedidosOut = []; S.comuns = { 'u-dora': 2, 'u-edu': 1 };
    const nada = () => new Promise(() => { });
    S.db = { marcarLidas: () => Promise.resolve(), collection: () => ({ add: nada }), doc: () => ({ delete: nada, set: nada }), rpc: nada, recarregar: () => { } };
    const po = (n, autor, at, x) => ({ id: n + '0000000-1111-4111-8111-11111111111' + n, autor, tipo: 'post', at: T - at, texto: '', fotos: [], ...x });
    PUB.on = true; PUB.carregou = true; PUB.uid = 'u-pedro';
    PUB.itens = [po('a', 'u-pedro', 2 * H, { texto: 'Primeira publicação, só texto, com #economia.' }),
      po('b', 'u-pedro', 5 * H, { texto: 'Comentando a notícia do dia.', pid: p0.id, estilo: { v: 2 } }),
      po('c', 'u-pedro', 3 * D, { texto: 'Esta fica fixada no alto.', fixado: T - D }),
      po('d', 'u-pedro', 4 * D, { texto: 'Dólar volta a subir\n\nA alta pressiona a inflação.', estilo: { v: 2, cn: { k: 'ana', tit: 'Dólar volta a subir', fu: 'Banco Central' } } }),
      po('e', 'u-pedro', 6 * D, { texto: '', pid: p1.id, estilo: { v: 2, rp: { k: 'pauta', id: p1.id } } }),
      po('f', 'u-bia', 3 * H, { texto: 'Bia escreve sobre o trânsito.', estilo: { v: 2, tags: [{ u: 'u-pedro' }] } }),
      po('7', 'u-bia', 2 * D, { texto: 'Notícia que vale ler.', pid: p2.id, estilo: { v: 2 } }),
      po('8', 'u-edu', 4 * H, { texto: 'Edu publica para todos.' })];
    if (seguir) { V9.on = true; SG181.uid = S.uid; SG181.on = true; CS123.sigo = new Set(['u-bia', 'u-caio']); SG181.fech = new Set(['u-dora']); SG181.rec = [{ uid: 'u-edu' }]; SG181.aberto = false;
      document.body.classList.add('sg181-on');
      CS123.perf = { 'u-pedro': { ok: true, seguidores: 3, seguindo: 2, aberto: false, t: T }, 'u-bia': { ok: true, seguidores: 5, seguindo: 4, aberto: true, me_segue: true, t: T },
        'u-caio': { ok: true, seguidores: 1, seguindo: 1, aberto: true, me_segue: true, t: T }, 'u-dora': { ok: true, seguidores: 7, seguindo: 1, aberto: false, me_segue: false, t: T },
        'u-edu': { ok: true, seguidores: 2, seguindo: 0, aberto: true, me_segue: true, t: T } } }
    updateBadge();
  }, !!seguir);
}
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
  const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
  await pfEstado(P, true);
  // 1. seguidores › perfil › voltar
  await P.evaluate(() => { const l = { seguidores: [{ uid: 'u-bia', nome: 'Bia Souza' }, { uid: 'u-edu', nome: 'Edu Prado' }] }; SB = { rpc: (n, a) => Promise.resolve({ data: n === 'seg_lista' ? l[a.p_tipo] || [] : [] }), from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) }; go('me'); scrollTo(0, 0) });
  await sleep(300); await P.evaluate(() => cs123Lista('u-pedro', 'seguidores')); await sleep(500);
  const tem = await P.evaluate(() => !!document.getElementById('cs123-lb') && document.querySelectorAll('#cs123-lb li').length);
  await P.evaluate(() => abrirPerfil('u-bia')); await sleep(900);
  const naPf = await P.evaluate(() => !!document.querySelector('#layer .pfv'));
  await P.evaluate(() => { const v = document.querySelector('#layer .pfv [data-pfvolta]'); if (v) v.click(); else closeLayer() }); await sleep(1000);
  const volta = await P.evaluate(() => !!document.getElementById('cs123-lb') && /Seus seguidores/.test(document.querySelector('#layer').innerText));
  ok(tem && naPf && volta, '1: abrir perfil da lista de seguidores e voltar reabre a lista', { tem, naPf, volta });
  await P.evaluate(() => { try { closeLayer() } catch (e) {} }); await sleep(300);
  // 2. Enter duplo para sair da citação
  await P.evaluate(() => { ed132Abre(ed132Novo({ tit: 'Teste' })) }); await sleep(500);
  await P.evaluate(() => { const c = document.getElementById('ed132-corpo'); c.innerHTML = '<blockquote><p>citação</p></blockquote>'; c.focus(); const r = document.createRange(); r.selectNodeContents(c.querySelector('blockquote p')); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) });
  await P.keyboard.press('Enter'); await P.keyboard.press('Enter'); await P.keyboard.type('seguindo');
  const r2 = await P.evaluate(() => document.getElementById('ed132-corpo').innerHTML);
  ok(/<\/blockquote><p>seguindo/.test(r2) && !/<p><br><\/p>/.test(r2), '2: sair da citação com Enter duplo não deixa linha vazia', r2);
  await P.evaluate(() => { try { ED132.E = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false } catch (e) {} }); await sleep(300);
  // 3. post com foto embaixo da própria notícia: sem o quadro que repete a notícia
  const r3 = await P.evaluate(() => { const p0 = FEED.pautas[0]; const x = { id: 'z0000000-1111-4111-8111-111111111111', autor: 'u-pedro', tipo: 'post', at: Date.now(), texto: 'Meu comentário', fotos: [{ path: 'x.jpg', w: 800, h: 800 }], pid: p0.id, estilo: { v: 2 } };
    let h = ''; try { h = renderPubPost ? renderPubPost(x) : '' } catch (e) { }
    if (!h) { const tp = `<article class="post upost"><div class="car"><div class="track"><div class="sl up-sl"><img></div><div class="sl up-sl up-nt"><button>n</button></div></div></div><div class="acts"><div class="prog pdots"><i class="on"></i><i></i><span class="pg">1/2</span></div></div></article>`; h = tp }
    const o = fc107Junto(h, { id: x.id, __pub: x, __fc107: { k: 0, n: 1 } }); return { nt: /up-nt/.test(o), dots: /pdots/.test(o) } });
  ok(!r3.nt && !r3.dots, '3: post com foto sob a própria notícia sem o 2º quadro da notícia', r3);
  await ctx.close(); await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
