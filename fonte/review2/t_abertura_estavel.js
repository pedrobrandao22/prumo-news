// 141: abertura estável — a Capa não pisca ao abrir o app (celular 390x844 com toque, CPU 4x, rede 4G simulada no servidor).
// Três aberturas no mesmo "aparelho": 1ª visita (sem cache), volta ao app (service worker e edição guardados) e volta com versão
// nova publicada. Em cada uma, durante ~7 s, confere:
//   - CLS (layout-shift) ≤ 0,05;
//   - o conteúdo da Capa é trocado inteiro no máximo 1 vez (esqueleto → Capa); depois só muda no lugar (MutationObserver/identidade
//     da raiz do #v-capa e dos cartões .cpi);
//   - nenhuma recarga automática (uma navegação só), nem com versão nova (ela fica guardada para a próxima abertura);
//   - o tema escolhido (escuro, com o sistema claro) já vale na 1ª pintura e não troca depois;
//   - a faixa "Agora" e a foto da manchete não empurram a Capa; console limpo.
// Serve uma cópia do site (pasta ab141t/, apagada no fim) com a edição do repositório dividida pelo tools/feed_leve.py.
// Portas 8790–8791 (se ocupadas, 8776–8777). AB141_PASTA=/outra/pasta (um build) mede outra versão (p.ex. a de antes) e só imprime.
const U = require('../t_util'); const { ok, sleep } = U;
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib'), crypto = require('crypto'), cp = require('child_process'), os = require('os'), net = require('net');
const DIR = path.join(__dirname, '..', 'ab141t');
const RTT = 150, KBPS = 1600;
const spIso = ms => new Date(Date.now() + ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
const spHora = ms => { const s = spIso(ms); return s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11, 13) + 'h' + s.slice(14, 16) };
const livre = porta => new Promise(ok => { const s = net.createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true))).listen(porta) });
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
let EXTRA = '', VERSAO = null;
function servidor(porta) {  // parecido com o GitHub Pages (gzip, ETag/304), com atraso e banda de 4G divididos entre as respostas
  const FILA = []; let TIQUE = null;
  const tique = () => { let orc = Math.round(KBPS * 1000 / 8 / 40);
    while (orc > 0 && FILA.length) { const n = Math.max(1, Math.floor(orc / FILA.length)); for (const x of [...FILA]) { const k = Math.min(n, x.corpo.length - x.i); x.res.write(x.corpo.slice(x.i, x.i + k)); x.i += k; orc -= k; if (x.i >= x.corpo.length) { x.res.end(); FILA.splice(FILA.indexOf(x), 1) } } }
    if (!FILA.length) { clearInterval(TIQUE); TIQUE = null } };
  const s = http.createServer((req, res) => { const nova = !req.socket._usado; req.socket._usado = 1;
    setTimeout(() => { let f = decodeURIComponent(req.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
      const arq = path.join(DIR, f); if (!arq.startsWith(DIR) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end() }
      let corpo = fs.readFileSync(arq);
      if (EXTRA && f === '/index.html') { let t = corpo.toString(); if (VERSAO) t = t.replace(/APP_VERSAO="[0-9a-f]{12}"/, 'APP_VERSAO="' + VERSAO + '"'); const i = t.lastIndexOf('</body>'); corpo = Buffer.from(t.slice(0, i) + EXTRA + t.slice(i)) }
      if (VERSAO && f === '/versao.json') corpo = Buffer.from(JSON.stringify({ v: VERSAO }));
      const tipo = TIPOS[path.extname(arq)] || 'application/octet-stream', etag = '"' + crypto.createHash('md5').update(corpo).digest('hex').slice(0, 16) + '"';
      const h = { 'Content-Type': tipo, 'Cache-Control': 'max-age=600', ETag: etag };
      if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end() }
      if (/text|javascript|json|svg/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] || '')) { corpo = zlib.gzipSync(corpo); h['Content-Encoding'] = 'gzip' }
      h['Content-Length'] = corpo.length; res.writeHead(200, h); FILA.push({ res, corpo, i: 0 }); if (!TIQUE) TIQUE = setInterval(tique, 25);
    }, RTT + (nova ? 2 * RTT : 0)) });
  s.keepAliveTimeout = 60000; s.listen(porta); return s;
}
// gravador da abertura (roda antes de qualquer script da página)
const INIT = `(() => {
  try { localStorage.setItem('prumo-teste-capa','1'); localStorage.setItem('prumo-teste-tour','1'); localStorage.setItem('prumo-teste-semreels','1');
    localStorage.setItem('prumo-teste-anim','1'); localStorage.setItem('prumo-teste-versao','1');
    const P = JSON.parse(localStorage.getItem('radar-prefs') || '{}'); if (P.tema !== 'escuro') { P.tema = 'escuro'; localStorage.setItem('radar-prefs', JSON.stringify(P)) } } catch (e) {}
  const T = () => Math.round(performance.now()); const M = window.__ab = { cls: 0, ls: [], raiz: 0, cpiTroca: 0, temas: [], capa: 0, ev: [], opMin: 1, ultTroca: 0 };
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.hadRecentInput) return; M.cls += e.value; M.ls.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.nodeName)).join(' ').slice(0, 120)]) })).observe({ type: 'layout-shift', buffered: true }) } catch (e) {}
  let raiz0 = null; const vistos = new Map();
  const olha = () => { const b = document.body; if (b) { const bg = getComputedStyle(b).backgroundColor; if (M.temas[M.temas.length - 1] !== bg) { M.temas.push(bg); M.ev.push([T(), 'fundo ' + bg]) } }
    const c = document.getElementById('v-capa'); if (!c) return; const r = c.firstElementChild;
    if (r && r.querySelector('.cpi')) { const o = +getComputedStyle(c).opacity; if (o < M.opMin) M.opMin = o }
    if (r && r !== raiz0 && r.querySelector('.cpi')) { M.raiz++; M.ultTroca = T(); M.ev.push([T(), 'Capa trocada inteira #' + M.raiz]); if (!M.capa) M.capa = T() }
    raiz0 = r; c.querySelectorAll('.cpi[id]').forEach(e => { const o = vistos.get(e.id); if (o && o !== e && o.isConnected === false) M.cpiTroca++; vistos.set(e.id, e) }) };
  new MutationObserver(olha).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-aparencia', 'class'] });
  const raf = () => { olha(); requestAnimationFrame(raf) }; requestAnimationFrame(raf);
})();`;

(async () => {
  const PASTA_OUTRA = process.env.AB141_PASTA ? path.resolve(process.env.AB141_PASTA) : null;
  const [P1] = (await livre(8790)) && (await livre(8791)) ? [8790] : [8776];
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(PASTA_OUTRA || path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  // edição do repositório, "de agora", dividida em leve + detalhe; rodadas recentes; faixa "Agora" com assunto de 10 min atrás
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = spIso(-15 * 60000); fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F));
  console.log('  ' + cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]).toString().trim());
  const r0 = spIso(-20 * 60000); fs.writeFileSync(path.join(DIR, 'rodadas.json'), JSON.stringify({ dia: spIso(0).slice(0, 10), itens: { [r0.slice(11, 13) + 'h' + r0.slice(14, 16)]: { tipo: 'rapida', status: 'ok', publicou: true } } }));
  fs.writeFileSync(path.join(DIR, 'novidades.json'), JSON.stringify({ gerado: spIso(-5 * 60000), novos: [{ assunto: 'Senado conclui votação da proposta sobre segurança pública em plenário', secao: 'politica', n_fontes: 3, relevante: true, manchetes: [{ titulo: 'Senado conclui votação da proposta sobre segurança pública em plenário', hora: spHora(-10 * 60000) }] }], em_pautas: {} }));
  for (const f of ['fotos-arquivo.json', 'indicadores.json']) { try { fs.copyFileSync(path.join(U.REPO, f), path.join(DIR, f)) } catch (e) { } }
  const FOTO = (() => { try { const d = path.join(U.REPO, 'acervo', 't'); return fs.readFileSync(path.join(d, fs.readdirSync(d).find(x => /\.(webp|jpe?g)$/.test(x)))) } catch (e) { return null } })();
  const srv = servidor(P1); await sleep(300);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'ab141-'));
  const EXE = process.env.PRUMO_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
  const contexto = async () => { const ctx = await require('playwright').chromium.launchPersistentContext(perfil, { executablePath: EXE, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light', serviceWorkers: 'allow' });
    await ctx.addInitScript(INIT);
    await ctx.route(u => !u.href.startsWith(`http://localhost:${P1}`), async r => { const q = r.request();
      if (/supabase\.js/.test(q.url())) return r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.supabase=null' });
      if (q.resourceType() === 'image' && FOTO) { await sleep(400); return r.fulfill({ status: 200, contentType: 'image/webp', body: FOTO }) }
      return r.fulfill({ status: 204, body: '' }) });
    return ctx };
  async function abrir(ctx, nome, ms = 7000) {
    const p = await ctx.newPage(); const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let navs = 0; p.on('framenavigated', fr => { if (fr === p.mainFrame()) navs++ });
    const cons = []; p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) cons.push(m.text()) }); p.on('pageerror', e => cons.push(e.message));
    await p.goto(`http://localhost:${P1}/`, { waitUntil: 'commit', timeout: 60000 }); await sleep(ms);
    const M = await p.evaluate(() => ({ ...window.__ab, cpi: document.querySelectorAll('#v-capa .cpi').length, agora: !!document.querySelector('#v-capa .cp-agora'), ap: document.documentElement.getAttribute('data-aparencia'),
      fotos: [...document.querySelectorAll('#v-capa .foto img')].filter(i => i.complete && i.naturalWidth).length, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller), nova: typeof VERSAO_NOVA !== 'undefined' ? VERSAO_NOVA : null, marca: !!document.getElementById('marca-nova') })).catch(e => ({ erro: e.message }));
    M.navs = navs; M.cons = cons; M.estavel = Math.max(M.capa || 0, M.ultTroca || 0, ...(M.ls || []).map(x => x[0]));
    console.log(`  ${nome}: Capa em ${M.capa} ms · estável em ${M.estavel} ms · opacidade mínima ${(+M.opMin).toFixed(2)} · CLS ${(+M.cls || 0).toFixed(4)} · trocas inteiras ${M.raiz} · cartões trocados ${M.cpiTroca} · navegações ${navs} · fundos ${JSON.stringify(M.temas)} · Agora ${M.agora} · fotos ${M.fotos}${M.ls && M.ls.length ? ' · deslocamentos ' + JSON.stringify(M.ls).slice(0, 400) : ''}`);
    return { p, M };
  }
  const confere = (nome, M, extra = {}) => {
    if (PASTA_OUTRA) return;
    ok(M.cpi > 5, `${nome}: Capa com conteúdo (${M.cpi} cartões)`);
    ok(M.cls <= 0.05, `${nome}: CLS ≤ 0,05 (${(+M.cls).toFixed(4)})`, M.ls);
    ok(M.raiz <= 1 && M.cpiTroca === 0, `${nome}: a Capa é trocada inteira no máximo 1 vez (${M.raiz}) e nenhum cartão é refeito (${M.cpiTroca})`);
    ok(M.navs === 1, `${nome}: nenhuma recarga automática (${M.navs} navegação)`);
    ok(M.opMin === 1, `${nome}: a Capa não some nem esmaece depois de aparecer (opacidade mínima ${M.opMin})`);
    const escuro = c => { const m = String(c).match(/\d+/g); return m && (+m[0] + +m[1] + +m[2]) < 200 };
    ok(M.ap === 'escuro' && M.temas.length >= 1 && M.temas.every(escuro), `${nome}: tema escolhido (escuro) desde a 1ª pintura, sem trocar ${JSON.stringify(M.temas)}`);
    ok(M.agora, `${nome}: faixa "Agora" na Capa`);
    ok(!M.cons.length, `${nome}: console limpo`, M.cons);
    if (extra.fotos) ok(M.fotos > 0, `${nome}: fotos da Capa carregadas (${M.fotos})`);
  };
  try {
    let ctx = await contexto();
    let { p, M } = await abrir(ctx, '1ª visita'); confere('1ª visita', M);
    await p.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready }); await p.goto(`http://localhost:${P1}/`); await sleep(3000); await ctx.close();
    ctx = await contexto(); ({ p, M } = await abrir(ctx, 'volta ao app')); confere('volta ao app', M, { fotos: true });
    if (!PASTA_OUTRA) ok(M.sw, 'volta ao app: com o service worker no controle');
    await ctx.close();
    EXTRA = '<i id="marca-nova"></i>'; VERSAO = 'ab141ab141ab';
    ctx = await contexto(); ({ p, M } = await abrir(ctx, 'versão nova', 9000)); confere('versão nova', M);
    if (!PASTA_OUTRA) ok(!M.marca && !!M.nova, `versão nova: fica guardada para a próxima abertura, sem recarregar a tela (VERSAO_NOVA=${M.nova})`);
    await p.close(); ({ p, M } = await abrir(ctx, 'abertura seguinte', 5000));
    if (!PASTA_OUTRA) ok(M.marca && M.navs === 1, 'abertura seguinte: já com a versão nova, sem recarregar');
    await ctx.close();
  } finally { srv.close(); fs.rmSync(perfil, { recursive: true, force: true }); fs.rmSync(DIR, { recursive: true, force: true }) }
  const R = U.resumo(); console.log(`\nRESUMO t_abertura_estavel: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { fs.rmSync(DIR, { recursive: true, force: true }) } catch (_) { } process.exit(2) });
