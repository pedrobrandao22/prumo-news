// Travamento do Perfil com o "só seguir" ligado (18/11): sem os números da pessoa guardados (CS123.perf[u]) e sem conseguir buscá-los
// (sem rede, erro no banco, ou SB ainda nulo), três remendos — pfCab (123, no 205), cs123PoeNum (123) e sg181Pf (181) — chamavam
// cs123Perf(u).then(redesenha). O redesenho achava o cache ainda vazio e pedia de novo, 3 vezes por desenho: 3, 9, 27… redesenhos
// em microtarefas, a aba crescia na memória até cair ("Target crashed"). No próprio perfil, o mesmo com renderMe (2 por desenho).
// Aqui um contador embrulha pfvDesenha/renderMe/cs123Perf e para (lança erro) depois de 300 chamadas, para o teste falhar sem derrubar a aba.
// Cenários: (1) perfil aberto de quem você não segue (u-edu), cache vazio e banco falhando; (2) idem com SB nulo (o estado do
// review2/fotos_iguais.js, área perfil, tela seguir); (3) o seu perfil, cache vazio e banco falhando; (4) banco responde: os números
// aparecem e o desenho para logo; (5) perfil fechado (u-dora) e amigo (u-bia) com o cache vazio e o banco falhando.
// Porta 9260.   NODE_PATH=$(npm root -g) node review2/t_travamento_perfil.js
const U = require('../t_util'); const { ok, sleep } = U;
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FONTE = path.resolve(__dirname, '..'), SITE = 'site-t260', PORTA = 9260;
(async () => {
  execFileSync('python3', ['build.py', 'https://teste.supabase.co', 'sb_publishable_teste123', '--saida', SITE], { cwd: FONTE, stdio: 'ignore' });
  for (const f of ['indicadores.json', 'novidades.json', 'fotos-arquivo.json', 'feed-leve.json']) fs.rmSync(path.join(FONTE, SITE, f), { force: true });
  fs.copyFileSync(path.join(__dirname, 'feed-fotos.json'), path.join(FONTE, SITE, 'feed.json'));
  U.servir(SITE, PORTA); await sleep(800);
  const b = await U.navegador();
  const cena = async (nome, fn) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    await ctx.route(u => !/^https?:\/\/localhost[:/]/.test(u.toString()), r => r.abort());
    await ctx.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) { } });
    const P = await ctx.newPage(); let caiu = false; P.on('crash', () => { caiu = true });
    const erros = []; P.on('pageerror', e => erros.push(e.message));
    await P.goto(`http://localhost:${PORTA}/index.html`);
    await U.esperar(P, () => typeof FEED !== 'undefined' && !!FEED && !!document.querySelector('#v-capa .cpi'), null, 15000);
    await sleep(1500);
    try { await fn(P) } catch (e) { ok(false, nome + ': rodou', e.message.split('\n')[0]) }
    ok(!caiu, nome + ': a aba não caiu');
    ok(!erros.some(e => /PARADA/.test(e)), nome + ': nenhum laço (o contador não chegou a 300)', erros.filter(e => /PARADA/.test(e)).slice(0, 2));
    await ctx.close();
  };
  // estado do fotos_iguais (pfEstado com "seguir") + banco: 'falha' (rpc rejeita como sem rede), 'nulo' (SB = null) ou 'responde'
  const estado = (P, banco, apaga) => P.evaluate(([banco, apaga]) => {
    const T = Date.now(), H = 36e5;
    S.uid = 'u-pedro'; S.user = { id: 'u-pedro', email: 'pedro@x.com' }; S.email = 'pedro@x.com'; S.membro = true; S.amigosOk = true;
    S.membros = { 'u-pedro': { nome: 'Pedro' }, 'u-bia': { nome: 'Bia Souza' }, 'u-caio': { nome: 'Caio Lima' }, 'u-dora': { nome: 'Dora Reis' }, 'u-edu': { nome: 'Edu Prado' } };
    S.amigos = new Set(['u-bia', 'u-caio']); S.pedidosIn = ['u-edu']; S.pedidosOut = []; S.comuns = { 'u-dora': 2, 'u-edu': 1 };
    const nada = () => new Promise(() => { });
    S.db = { marcarLidas: () => Promise.resolve(), collection: () => ({ add: nada }), doc: () => ({ delete: nada, set: nada }), rpc: nada, recarregar: () => { } };
    const po = (n, autor, at, x) => ({ id: n + '0000000-1111-4111-8111-11111111111' + n, autor, tipo: 'post', at: T - at, texto: '', fotos: [], ...x });
    PUB.on = true; PUB.carregou = true; PUB.uid = 'u-pedro';
    PUB.itens = [po('a', 'u-pedro', 2 * H, { texto: 'Primeira.' }), po('f', 'u-bia', 3 * H, { texto: 'Bia.' }), po('8', 'u-edu', 4 * H, { texto: 'Edu publica para todos.' })];
    V9.on = true; SG181.uid = S.uid; SG181.on = true; CS123.uid = S.uid; CS123.sigo = new Set(['u-bia', 'u-caio']); SG181.fech = new Set(['u-dora']); SG181.rec = [{ uid: 'u-edu' }]; SG181.aberto = false;
    document.body.classList.add('sg181-on');
    const NUM = { 'u-pedro': { ok: true, seguidores: 3, seguindo: 2, aberto: false }, 'u-bia': { ok: true, seguidores: 5, seguindo: 4, aberto: true, me_segue: true },
      'u-caio': { ok: true, seguidores: 1, seguindo: 1, aberto: true, me_segue: true }, 'u-dora': { ok: true, seguidores: 7, seguindo: 1, aberto: false, me_segue: false },
      'u-edu': { ok: true, seguidores: 2, seguindo: 0, aberto: true, me_segue: true } };
    CS123.perf = {}; for (const [u, p] of Object.entries(NUM)) if (!apaga.includes(u)) CS123.perf[u] = { ...p, t: T };
    // banco de mentira: qualquer cadeia SB.x(...).y(...) termina num "thenable" que rejeita (falha) ou responde
    const resp = (nome, a) => nome === 'seg_contagem' || nome === 'seguidores_contagem' ? { data: NUM[a && a.p_uid] || null } : { data: [] };
    const cadeia = (v) => new Proxy(function () { }, { get: (_, k) => k === 'then' ? (ok, no) => (banco === 'falha' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(v || { data: [] })).then(ok, no) : () => cadeia(v), apply: () => cadeia(v) });
    SB = banco === 'nulo' ? null : new Proxy({}, { get: (_, k) => k === 'rpc' ? (n, a) => banco === 'falha' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(resp(n, a)) : () => cadeia() });
    updateBadge();
    window.CT = {};
    const conta = (nome) => { const f = window[nome]; if (typeof f !== 'function') return; window[nome] = function () {
      const n = CT[nome] = (CT[nome] || 0) + 1; if (n > 300) throw new Error('PARADA ' + nome); return f.apply(this, arguments) } };
    ['pfvDesenha', 'renderMe', 'cs123Perf'].forEach(conta);
  }, [banco, apaga]);
  const abre = async (P, u) => { await P.evaluate(u => { if (document.querySelector('#layer').innerHTML) closeLayer(); CT.pfvDesenha = CT.renderMe = CT.cs123Perf = 0; abrirPerfil(u) }, u); await sleep(1500);
    return Promise.race([P.evaluate(() => ({ ...CT, num: !!document.querySelector('#layer .pfv .sg181-num'), cab: !!document.querySelector('#layer .pfv .vn-pf-nome, #layer .pfv .pf-nome') })), sleep(5000).then(() => null)]) };

  await cena('1 perfil aberto, banco falhando', async P => { await estado(P, 'falha', ['u-edu']); const r = await abre(P, 'u-edu');
    ok(r && r.pfvDesenha <= 6, '1: perfil de u-edu desenha poucas vezes (≤ 6)', r); ok(r && r.cab, '1: o perfil aparece (nome)', r);
    await sleep(1500); const r2 = await P.evaluate(() => ({ ...CT })); ok(r2.pfvDesenha === r.pfvDesenha, '1: e não continua redesenhando sozinho', [r, r2]) });
  await cena('2 perfil aberto, SB nulo (estado do fotos_iguais)', async P => { await estado(P, 'nulo', ['u-edu']); const r = await abre(P, 'u-edu');
    ok(r && r.pfvDesenha <= 6, '2: perfil de u-edu desenha poucas vezes (≤ 6)', r) });
  await cena('3 o seu perfil, banco falhando', async P => { await estado(P, 'falha', ['u-pedro']);
    await P.evaluate(() => { CT.renderMe = CT.cs123Perf = 0; go('me') }); await sleep(1500);
    const r = await Promise.race([P.evaluate(() => ({ ...CT, me: !!document.querySelector('#v-me .vn-pf-num, #v-me .pf-nome') })), sleep(5000).then(() => null)]);
    ok(r && r.renderMe <= 6, '3: o seu perfil desenha poucas vezes (≤ 6)', r); ok(r && r.me, '3: o seu perfil aparece', r) });
  await cena('4 banco responde', async P => { await estado(P, 'responde', ['u-edu', 'u-pedro']); const r = await abre(P, 'u-edu');
    ok(r && r.num, '4: os números de u-edu aparecem depois que o banco responde', r); ok(r && r.pfvDesenha <= 8, '4: e o desenho para logo (≤ 8)', r);
    await P.evaluate(() => { closeLayer(); CT.renderMe = 0; go('me') }); await sleep(1200);
    const m = await P.evaluate(() => ({ n: CT.renderMe, num: !!document.querySelector('#v-me .sg181-num') })); ok(m.num && m.n <= 8, '4: no seu perfil também', m) });
  await cena('5 perfil fechado e amigo, banco falhando', async P => { await estado(P, 'falha', ['u-dora', 'u-bia']);
    for (const u of ['u-dora', 'u-bia']) { const r = await abre(P, u); ok(r && r.pfvDesenha <= 6, `5: perfil de ${u} desenha poucas vezes (≤ 6)`, r) } });

  await b.close();
  fs.rmSync(path.join(FONTE, SITE), { recursive: true, force: true });
  const { OKS, FALHAS } = U.resumo(); console.log(`\n${OKS} ok, ${FALHAS} falhas`); process.exit(FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
