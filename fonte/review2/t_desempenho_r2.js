// 170 (desempenho, 16/11): primeira visita em rede lenta — quanto a página pesa e quando a manchete aparece.
// Celular Pixel 7 (412x915, toque, CPU 4x), perfil novo (sem cache nem service worker), servidor local parecido com o GitHub
// Pages (gzip, ETag) com atraso e banda divididos entre as respostas (como em t_abertura_estavel). O supabase.js do CDN e as
// fotos também passam pela mesma banda (a rede do celular é uma só).
// Mede, em 3G (1,6 Mb/s, 300 ms) e 4G (9 Mb/s, 100 ms): tempo até a manchete (1º cartão da Capa com título), bytes baixados até
// ela e a linha do tempo dos pedidos. Confere:
//   - index.html comprimido abaixo do limite (avisa se o app engordar);
//   - nada que não é da 1ª tela (fontes da Newsreader itálica, fotos-arquivo.json, supabase.js, ícones) disputa a banda antes da
//     manchete; a fonte Newsreader chega e é usada depois;
//   - Capa com conteúdo, console limpo.
// Portas 8750–8751. DP170_PASTA=/outra/pasta (um build) mede outra versão e só imprime. DP170_N=3 repete cada perfil.
const U = require('../t_util'); const { ok, sleep } = U;
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib'), crypto = require('crypto'), cp = require('child_process'), os = require('os');
const DIR = path.join(__dirname, '..', 'dp170t');
const PORTA = 8750;
const PERFIS = [{ nome: '3G', kbps: 1600, rtt: 300 }, { nome: '4G', kbps: 9000, rtt: 100 }];
const spIso = ms => new Date(Date.now() + ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
let PERFIL = PERFIS[0], T0 = 0, LOG = [];
// supabase.js de verdade pesa ~55 KB comprimido: aqui um substituto do mesmo peso (comentário aleatório) que não faz nada
const SBJS = Buffer.from('window.supabase=null;/*' + crypto.randomBytes(56000).toString('base64') + '*/');
let FOTO = null;
function servidor(porta) {
  const FILA = []; let TIQUE = null;
  const tique = () => { let orc = Math.round(PERFIL.kbps * 1000 / 8 / 40);
    while (orc > 0 && FILA.length) { const n = Math.max(1, Math.floor(orc / FILA.length)); for (const x of [...FILA]) { const k = Math.min(n, x.corpo.length - x.i); x.res.write(x.corpo.slice(x.i, x.i + k)); x.i += k; orc -= k; if (x.i >= x.corpo.length) { x.res.end(); x.log.fim = Date.now() - T0; FILA.splice(FILA.indexOf(x), 1) } } }
    if (!FILA.length) { clearInterval(TIQUE); TIQUE = null } };
  const s = http.createServer((req, res) => { const nova = !req.socket._usado; req.socket._usado = 1; const log = { url: req.url.split('?')[0], ini: Date.now() - T0 }; LOG.push(log);
    setTimeout(() => { let f = decodeURIComponent(req.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
      let corpo, tipo;
      if (f === '/__sbjs') { corpo = SBJS; tipo = TIPOS['.js'] } else if (f === '/__foto') { corpo = FOTO; tipo = TIPOS['.webp'] } else {
        const arq = path.join(DIR, f); if (!arq.startsWith(DIR) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { log.fim = Date.now() - T0; res.writeHead(404); return res.end() }
        corpo = fs.readFileSync(arq); tipo = TIPOS[path.extname(arq)] || 'application/octet-stream' }
      const etag = '"' + crypto.createHash('md5').update(corpo).digest('hex').slice(0, 16) + '"';
      const h = { 'Content-Type': tipo, 'Cache-Control': 'max-age=600', ETag: etag, 'Access-Control-Allow-Origin': '*' };
      if (req.headers['if-none-match'] === etag) { log.fim = Date.now() - T0; res.writeHead(304, h); return res.end() }
      if (/text|javascript|json|svg/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] || '')) { corpo = zlib.gzipSync(corpo); h['Content-Encoding'] = 'gzip' }
      log.bytes = corpo.length; h['Content-Length'] = corpo.length; res.writeHead(200, h); FILA.push({ res, corpo, i: 0, log }); if (!TIQUE) TIQUE = setInterval(tique, 25);
    }, PERFIL.rtt + (nova ? 2 * PERFIL.rtt : 0)) });
  s.keepAliveTimeout = 60000; s.listen(porta); return s;
}
const INIT = `(() => {
  try { localStorage.setItem('prumo-teste-capa','1'); localStorage.setItem('prumo-teste-tour','1'); localStorage.setItem('prumo-teste-semreels','1'); localStorage.setItem('prumo-teste-anim','1') } catch (e) {}
  const M = window.__dp = { manchete: 0, foto: 0 };
  const olha = () => { if (!M.manchete) { const c = document.querySelector('#v-capa .cpi'); if (c && c.textContent.trim().length > 20 && c.getBoundingClientRect().height > 0) M.manchete = Math.round(performance.now()) }
    if (M.manchete && !M.foto) { const i = document.querySelector('#v-capa .cpi-man img'); if (i && i.complete && i.naturalWidth) M.foto = Math.round(performance.now()) } };
  new MutationObserver(olha).observe(document, { subtree: true, childList: true });
  const raf = () => { olha(); if (!M.foto && performance.now() < 30000) requestAnimationFrame(raf) }; requestAnimationFrame(raf);
})();`;

(async () => {
  const OUTRA = process.env.DP170_PASTA ? path.resolve(process.env.DP170_PASTA) : null; const N = +process.env.DP170_N || 1;
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(OUTRA || path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = spIso(-15 * 60000); fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F));
  cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]);
  for (const f of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json']) { try { fs.copyFileSync(path.join(U.REPO, f), path.join(DIR, f)) } catch (e) { } }
  FOTO = (() => { try { const d = path.join(U.REPO, 'acervo', 't'); return fs.readFileSync(path.join(d, fs.readdirSync(d).find(x => /\.(webp|jpe?g)$/.test(x)))) } catch (e) { return Buffer.alloc(30000) } })();
  const html = fs.readFileSync(path.join(DIR, 'index.html')); const gz = zlib.gzipSync(html).length;
  console.log(`  index.html: ${(html.length / 1024).toFixed(0)} KB (${(gz / 1024).toFixed(0)} KB comprimido)`);
  const srv = servidor(PORTA); await sleep(300);
  const EXE = process.env.PRUMO_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
  const RES = {};
  try {
    for (const P of PERFIS.filter(x => !process.env.DP170_PERFIS || process.env.DP170_PERFIS.split(',').includes(x.nome))) for (let rep = 0; rep < N; rep++) {
      PERFIL = P; LOG = [];
      const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'dp170-'));
      const ctx = await require('playwright').chromium.launchPersistentContext(perfil, { executablePath: EXE, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
      await ctx.addInitScript(INIT);
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORTA}`), async r => { const q = r.request();
        if (/supabase\.js/.test(q.url())) return r.fulfill({ response: await r.fetch({ url: `http://localhost:${PORTA}/__sbjs` }) });
        if (q.resourceType() === 'image') return r.fulfill({ response: await r.fetch({ url: `http://localhost:${PORTA}/__foto?u=` + encodeURIComponent(q.url().slice(-40)) }) });
        return r.fulfill({ status: 204, body: '' }) });
      const p = await ctx.newPage(); const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const cons = []; p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) cons.push(m.text()) }); p.on('pageerror', e => cons.push(e.message));
      T0 = Date.now(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'commit', timeout: 60000 });
      const t0nav = Date.now() - T0;  // diferença entre o relógio do servidor e o performance.now() da página
      await U.esperar(p, () => window.__dp && window.__dp.manchete > 0, null, 40000); await sleep(4000);
      const M = await p.evaluate(() => ({ ...window.__dp, cpi: document.querySelectorAll('#v-capa .cpi').length,
        nr: [...document.fonts].filter(f => f.family.replace(/"/g, '') === 'Newsreader' && f.status === 'loaded').map(f => f.style),
        dcl: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd), resp: Math.round(performance.getEntriesByType('navigation')[0].responseEnd), mk: [window.__m1, window.__m2, window.__m3].map(x => Math.round(x || 0)), fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0) }));
      const manchSrv = M.manchete + (LOG[0] ? LOG[0].ini : 0);  // aproximado: relógio do servidor
      const antes = LOG.filter(x => x.ini < manchSrv - 200);  // folga: os dois relógios (servidor e página) não batem ao milissegundo
      const bytesAntes = antes.reduce((s, x) => s + (x.bytes || 0), 0);
      const linha = LOG.map(x => `${x.url.replace(/^\//, '') || 'index.html'} ${x.ini}→${x.fim ?? '…'} ${x.bytes ? Math.round(x.bytes / 1024) + 'K' : ''}`).join(' | ');
      console.log(`  ${P.nome}#${rep + 1}: 1ª pintura ${M.fcp} ms · DOMContentLoaded ${M.dcl} ms · manchete ${M.manchete} ms · foto da manchete ${M.foto || '-'} ms · ${Math.round(bytesAntes / 1024)} KB pedidos antes da manchete · resposta ${M.resp} ms${M.mk[0] ? ' · marcas ' + M.mk.join('/') : ''} · cartões ${M.cpi} · Newsreader ${JSON.stringify(M.nr)}`);
      if (process.env.DETALHE || OUTRA) console.log('     ' + linha);
      (RES[P.nome] = RES[P.nome] || []).push({ M, antes: antes.map(x => x.url), cons });
      await ctx.close(); fs.rmSync(perfil, { recursive: true, force: true });
    }
  } finally { srv.close(); fs.rmSync(DIR, { recursive: true, force: true }) }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] };
  for (const k in RES) console.log(`  ${k}: manchete (mediana de ${RES[k].length}) ${med(RES[k].map(r => r.M.manchete))} ms · foto da manchete ${med(RES[k].map(r => r.M.foto || 0))} ms`);
  if (!OUTRA) {
    ok(gz < 640 * 1024, `index.html comprimido abaixo de 640 KB (${(gz / 1024).toFixed(0)} KB)`);
    for (const k in RES) for (const r of RES[k]) {
      ok(r.M.cpi > 5 && r.M.manchete > 0, `${k}: Capa com a manchete (${r.M.cpi} cartões, ${r.M.manchete} ms)`);
      const intrusos = r.antes.filter(u => /newsreader-italico|fotos-arquivo|__sbjs|indicadores|icon-/.test(u));
      ok(!intrusos.length, `${k}: nada fora da 1ª tela disputa a banda antes da manchete`, intrusos);
      ok(r.M.nr.includes('normal'), `${k}: a Newsreader chega depois e é usada (${JSON.stringify(r.M.nr)})`);
      ok(!r.cons.length, `${k}: console limpo`, r.cons);
    }
  }
  const R = U.resumo(); console.log(`\nRESUMO t_desempenho_r2: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { fs.rmSync(DIR, { recursive: true, force: true }) } catch (_) { } process.exit(2) });
