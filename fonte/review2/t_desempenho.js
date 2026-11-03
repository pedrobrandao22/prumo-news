// Desempenho: abertura (fria e com o service worker), trocas de aba, abrir story e matéria — celular 390x844,
// CPU 4x mais lenta e rede de 4G simulada no próprio servidor (vale também para o que o service worker busca).
// Imprime os números e confere um orçamento folgado (para não falhar à toa).
// Uso: node review2/t_desempenho.js            (serve site/)
//      PERF_PASTA=/caminho/site node review2/t_desempenho.js   (outra pasta, p.ex. a versão antiga para comparar)
//      PERF_RODADAS=3 (padrão 2) · PERF_SEM_ORCAMENTO=1 só imprime
const U = require('../t_util'); const { ok, sleep } = U;
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const PORT = 8981;
const PASTA = path.resolve(process.env.PERF_PASTA || path.join(__dirname, '..', 'site'));
const RODADAS = +(process.env.PERF_RODADAS || 2);
const RTT = 150, KBPS = 1600, CONEXAO = 2 * RTT;  // 4G "lento" do Lighthouse: 150 ms, 1,6 Mbit/s; conexão nova paga TCP+TLS
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

// banda única, dividida entre as respostas em andamento (como num celular de verdade)
const FILA = []; let TIQUE = null, EXTRA = '';  // EXTRA: "publica" uma versão nova (só muda o index.html servido)
function tique() { let orc = Math.round(KBPS * 1000 / 8 / 40);  // bytes a cada 25 ms
  while (orc > 0 && FILA.length) { const n = Math.max(1, Math.floor(orc / FILA.length)); for (const x of [...FILA]) { const k = Math.min(n, x.corpo.length - x.i); x.res.write(x.corpo.slice(x.i, x.i + k)); x.i += k; orc -= k; if (x.i >= x.corpo.length) { x.res.end(); FILA.splice(FILA.indexOf(x), 1) } } }
  if (!FILA.length) { clearInterval(TIQUE); TIQUE = null } }
// servidor parecido com o GitHub Pages: gzip, ETag/304, Cache-Control max-age=600; com atraso e banda de 4G
function servidor() {
  const s = http.createServer((req, res) => {
    const nova = !req.socket._usado; req.socket._usado = 1;
    setTimeout(() => {
      let f = decodeURIComponent(req.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
      const arq = path.join(PASTA, f); if (!arq.startsWith(PASTA) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end() }
      let corpo = fs.readFileSync(arq); if (EXTRA && f === '/index.html') corpo = Buffer.from(corpo.toString().replace('</body>', EXTRA + '</body>')); const tipo = TIPOS[path.extname(arq)] || 'application/octet-stream';
      const etag = '"' + crypto.createHash('md5').update(corpo).digest('hex').slice(0, 16) + '"';
      const h = { 'Content-Type': tipo, 'Cache-Control': 'max-age=600', 'ETag': etag };
      if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end() }
      if (/text|javascript|json|svg/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] || '')) { corpo = zlib.gzipSync(corpo); h['Content-Encoding'] = 'gzip' }
      h['Content-Length'] = corpo.length; res.writeHead(200, h);
      FILA.push({ res, corpo, i: 0 }); if (!TIQUE) TIQUE = setInterval(tique, 25);
    }, RTT + (nova ? CONEXAO : 0));
  });
  s.keepAliveTimeout = 60000; s.listen(PORT); return s;
}

const INIT = `(() => {
  try { localStorage.setItem('prumo-teste-capa', '1') } catch (e) {}
  const M = window.__perf = { lt: [], capa: 0 };
  try { new PerformanceObserver(l => l.getEntries().forEach(e => M.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }) } catch (e) {}
  const marca = () => { if (M.capa) return; const c = document.getElementById('v-capa');
    if (c && !c.hidden && c.querySelector('.cp-i, [data-cpx], [data-cpmat], h2, h3') && (c.textContent || '').trim().length > 80) { const t = performance.now(); requestAnimationFrame(() => setTimeout(() => { M.capa = M.capa || Math.round(performance.now()); M.capaDom = Math.round(t) }, 0)) } };
  new MutationObserver(marca).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });
})();`;

async function abrir(ctx) {
  const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await c.send('Performance.enable');
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'commit', timeout: 60000 });
  await U.esperar(p, () => window.__perf && window.__perf.capa > 0, null, 40000);
  await sleep(6000);  // o que roda logo depois de abrir (Supabase, bandeja, ilustrações…)
  const r = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0] || {}; const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime;
    const lt = window.__perf.lt; return { capa: window.__perf.capa, fcp: Math.round(fcp || 0), resp: Math.round(n.responseStart || 0), dcl: Math.round(n.domContentLoadedEventEnd || 0),
      ltN: lt.length, ltSoma: lt.reduce((a, x) => a + x[1], 0), ltMaior: lt.reduce((a, x) => Math.max(a, x[1]), 0), ltAteCapa: lt.filter(x => x[0] < window.__perf.capa).reduce((a, x) => a + x[1], 0) } });
  const m = Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  r.script = Math.round(m.ScriptDuration * 1000); r.tarefas = Math.round(m.TaskDuration * 1000); r.estilo = Math.round((m.RecalcStyleDuration + m.LayoutDuration) * 1000);
  return { p, c, r };
}
async function medirAcao(p, fn, arg) {
  return p.evaluate(async ([src, arg]) => { const q = () => new Promise(ok => requestAnimationFrame(() => setTimeout(ok, 0))); await q(); await q();
    const t0 = performance.now(); const f = new Function('arg', src); const fim = f(arg); if (fim && fim.then) await fim; await q(); return Math.round(performance.now() - t0) }, [fn, arg]);
}
async function trocas(p) {
  const out = {};
  for (const rodada of ['1ª', '2ª']) for (const v of ['feed', 'msgs', 'busca', 'me', 'capa']) {
    out[v + ' ' + rodada] = await medirAcao(p, `document.getElementById('t-'+arg).click()`, v); await sleep(400) }
  // story (a seção do dia, no feed) e matéria (pela Capa)
  await medirAcao(p, `document.getElementById('t-feed').click()`); await sleep(500);
  out['story'] = await medirAcao(p, `const e=document.querySelector('[data-sec-story]');if(!e)return;e.click();return new Promise(ok=>{const t=()=>document.querySelector('#layer .story,#layer2 .story,.story')?ok():requestAnimationFrame(t);t()})`);
  await sleep(500); await p.evaluate(() => { for (let i = 0; i < 4 && (document.querySelector('#layer2').innerHTML || document.querySelector('#layer').innerHTML); i++) closeLayer() }); await sleep(500);
  await medirAcao(p, `document.getElementById('t-capa').click()`); await sleep(500);
  out['matéria'] = await medirAcao(p, `const e=document.querySelector('#v-capa [data-cpmat]');if(e)e.click();else abrirMateria(FEED.pautas[0].id);return new Promise(ok=>{const t=()=>document.querySelector('#layer .mat')?ok():requestAnimationFrame(t);t()})`);
  await sleep(400); await p.evaluate(() => closeLayer());
  return out;
}
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)] };

(async () => {
  const srv = servidor(); await sleep(300);
  const EXE = process.env.PRUMO_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
  const contexto = dir => require('playwright').chromium.launchPersistentContext(dir, { executablePath: EXE, ...opts });
  const opts = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'allow' };
  const rot = async ctx => { await ctx.addInitScript(INIT); await ctx.route(u => !u.href.startsWith(`http://localhost:${PORT}`), r => /supabase\.js/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.supabase=null' }) : r.fulfill({ status: 204, body: '' })) };
  const frio = [], morno = [], acoes = []; let NOVA = null;
  for (let i = 0; i < RODADAS; i++) {
    // 1ª abertura: nada guardado (sem cache, sem service worker)
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'prumo-perf-'));
    const ctx = await contexto(dir);
    await rot(ctx);
    let { p, r } = await abrir(ctx); frio.push(r);
    await p.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready });
    await p.goto(`http://localhost:${PORT}/`); await sleep(3000); await p.close();
    await ctx.close();  // fecha o "app": a próxima abertura usa conexão nova
    // volta ao app: service worker e edição guardados
    const ctx2 = await contexto(dir);
    await rot(ctx2);
    ({ p, r } = await abrir(ctx2)); r.sw = await p.evaluate(() => !!navigator.serviceWorker.controller); r.postsNaCapa = await p.evaluate(() => VIEW === 'capa' ? document.querySelectorAll('#posts .post').length : -1); morno.push(r);
    acoes.push(await trocas(p));
    if (i === RODADAS - 1) {  // versão nova publicada: abre a guardada na hora, depois recarrega sozinho com a nova (uma vez só)
      EXTRA = '<i id="marca-nova"></i>'; const q = await ctx2.newPage(); let navs = 0; q.on('framenavigated', fr => { if (fr === q.mainFrame()) navs++ });
      await q.goto(`http://localhost:${PORT}/`, { timeout: 60000 }); const nova = await U.esperar(q, () => !!document.getElementById('marca-nova') && document.querySelectorAll('#v-capa .cpi').length > 0, null, 30000);
      await sleep(4000); NOVA = { nova, navs, posts: await q.evaluate(() => document.querySelectorAll('#v-capa .cpi').length).catch(() => -1) };
      navs = 0; await q.goto(`http://localhost:${PORT}/`); await sleep(5000); NOVA.navs2 = navs; NOVA.nova2 = await q.evaluate(() => !!document.getElementById('marca-nova')).catch(() => false);
      EXTRA = ''; await q.close() }
    await ctx2.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  const linha = (nome, l) => { const ks = Object.keys(l[0]); console.log(nome.padEnd(8), ks.map(k => k + '=' + med(l.map(x => +x[k]))).join('  ')) };
  console.log(`\nPASTA ${PASTA} · ${RODADAS} rodadas (mediana) · CPU 4x · rede ${RTT} ms/${KBPS} kbit/s`);
  linha('fria', frio); linha('volta', morno);
  const A = {}; Object.keys(acoes[0]).forEach(k => A[k] = med(acoes.map(a => a[k])));
  console.log('ações (ms):', JSON.stringify(A));
  console.log('versão nova:', JSON.stringify(NOVA));
  console.log('PERFJSON ' + JSON.stringify({ frio: frio.map(x => x), volta: morno, acoes: A }));
  if (!process.env.PERF_SEM_ORCAMENTO) {
    const v = med(morno.map(x => x.capa)), f = med(frio.map(x => x.capa));
    ok(morno.every(x => x.sw), 'volta ao app com o service worker no controle');
    ok(v < 2500, 'volta ao app: Capa na tela em menos de 2,5 s (' + v + ' ms)');
    const rv = med(morno.map(x => x.resp));
    ok(rv < 400, 'volta ao app: a página vem da cópia guardada, sem esperar a rede (resposta em ' + rv + ' ms; a rede leva 450+)');
    ok(morno.every(x => x.postsNaCapa >= 0 && x.postsNaCapa <= 8), 'na Capa, o Feed escondido tem só o primeiro lote (' + morno.map(x => x.postsNaCapa) + ' posts)');
    ok(NOVA && NOVA.nova && NOVA.navs === 2 && NOVA.posts > 0, 'versão nova: abre a guardada e recarrega sozinho com a nova ' + JSON.stringify(NOVA));
    ok(NOVA && NOVA.nova2 && NOVA.navs2 === 1, 'versão nova: na abertura seguinte, sem recarregar de novo');
    ok(f < 9000, 'primeira abertura: Capa na tela em menos de 9 s (' + f + ' ms)');
    const trocaMax = Math.max(...['feed', 'msgs', 'busca', 'me', 'capa'].map(k => A[k + ' 2ª']));
    ok(trocaMax < 350, 'troca de aba (2ª vez) abaixo de 350 ms (' + trocaMax + ' ms)');
    ok(A['matéria'] < 600, 'abrir matéria abaixo de 600 ms (' + A['matéria'] + ' ms)');
    ok(A['story'] < 800, 'abrir story abaixo de 800 ms (' + A['story'] + ' ms)');
  }
  const R = U.resumo(); console.log(`RESUMO t_desempenho: ${R.OKS} ok, ${R.FALHAS} falhas`);
  srv.close(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
