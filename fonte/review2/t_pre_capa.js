// 121 (Fase 4, 18/11): a manchete antes do resto do app (js/121-pre-capa.js).
// Primeira visita em 3G e 4G (mesmo servidor lento do t_desempenho_r2). Confere:
//   - em 3G, o alto da Capa (cabeçalho e manchete) aparece com o feed-leve, bem antes do código (≥ 1,5 s antes da Capa pronta);
//   - o alto desenhado antes é IGUAL ao da Capa pronta (mesma marcação, tirando o desenho da arte e detalhes da foto): se
//     renderCapa/cpItem/capaArte/agoraHTML/dt185Rel mudarem e o 121 não acompanhar, este teste avisa;
//   - a troca não mexe nada de lugar (sem deslocamento de layout entre o alto antecipado e a Capa pronta);
//   - quem volta (com edição guardada) não usa o 121; console limpo.
// 170 (desempenho, 16/11) [base do 121]: primeira visita em rede lenta — quanto a página pesa e quando a manchete aparece.
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
const DIR = path.join(__dirname, '..', 'f4t');
const PORTA = 8752;
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
  try { if (!sessionStorage.getItem('f4-volta')) { localStorage.setItem('prumo-teste-capa','1'); localStorage.setItem('prumo-teste-tour','1'); localStorage.setItem('prumo-teste-semreels','1'); localStorage.setItem('prumo-teste-anim','1') } } catch (e) {}
  const M = window.__t = { pre: 0, real: 0, preRect: null, realRect: null, cls: [] };
  const ret = () => { const a = document.querySelector('#v-capa .cpi-man'), t = a && a.querySelector('.cp-t'), s = a && a.querySelector('.cp-sub'), r = e => e && e.getBoundingClientRect(); return a ? { y: Math.round(r(a).top), tY: Math.round(r(t).top), sY: Math.round(r(s).top) } : null };
  const top = () => { const cp = document.querySelector('#v-capa .cp'); if (!cp) return ''; const out = []; for (const e of cp.children) { out.push(e.outerHTML); if (e.classList.contains('cpi-man')) break } return out.join('') };
  const olha = () => { if (!M.pre && document.querySelector('#v-capa .cp.f4-pre .cpi-man')) { M.pre = Math.round(performance.now()); M.preRect = ret(); M.preHtml = top() }
    if (!M.real) { const c = document.querySelector('#v-capa .cp:not(.f4-pre) .cpi-man'); if (c) { M.real = Math.round(performance.now()); M.realRect0 = ret(); requestAnimationFrame(() => { M.realHtml0 = top() }) /* um quadro depois: o 185 já trocou as datas */ } } };
  new MutationObserver(olha).observe(document, { subtree: true, childList: true });
  /* a posição do alto antecipado no último quadro antes da troca (a fonte do título pode chegar no meio) */
  const raf = () => { if (M.pre && !M.real && document.querySelector('#v-capa .cp.f4-pre')) M.preRect = ret(); if (!M.real && performance.now() < 30000) requestAnimationFrame(raf) }; requestAnimationFrame(raf);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) M.cls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), n: (e.sources || []).map(s => s.node && s.node.className || '').join('|') }) }).observe({ type: 'layout-shift', buffered: true }) } catch (e) {}
})();`;

// marcação comparável: sem o desenho da arte (o 121 não tem as cenas), sem os detalhes que a foto ganha ao carregar
function norm(h) { return String(h || '').replace(/ f4-pre/g, '').replace(/(<svg[^>]*>)[\s\S]*?<\/svg>/g, '$1</svg>').replace(/ onerror="[^"]*"/g, '').replace(/ data-cr170="[^"]*"/g, '').replace(/ class="ok"/g, '').replace(/ class="ag-entra"/g, '') }

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = spIso(-15 * 60000);
  // um caso mais completo: a manchete com data da semana (vira "hoje"), correção recente e linha fina da Capa
  if (process.env.F4_CASO !== 'puro') { const man = (F.pautas || []).find(p => p.id === (F.capa || {}).manchete) || F.pautas[0];
    const hoje = new Date(Date.now() - 3 * 3600e3), sem = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][hoje.getUTCDay()];
    man.neutro.titulo = `Votação fica para ${sem} (${hoje.getUTCDate()}) depois de acordo "difícil" & longo`; man.correcoes = [{ hora: spIso(-3600e3), texto: 'Corrigido o placar.' }];
    delete man.foto;
    F.capa = { ...(F.capa || {}), manchete: man.id, linha_fina: `A sessão de ${sem} (${hoje.getUTCDate()}) começa às 10h; <b>texto</b> segue.` } }
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F));
  cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]);
  for (const f of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json']) { try { fs.copyFileSync(path.join(U.REPO, f), path.join(DIR, f)) } catch (e) { } }
  // a faixa "Agora" com dois assuntos recentes (para o 121 desenhar a faixa também)
  try { const nv = JSON.parse(fs.readFileSync(path.join(DIR, 'novidades.json'), 'utf8')); const d = new Date(Date.now() - 3 * 3600e3 - 20 * 60000), z = n => String(n).padStart(2, '0');
    const hr = `${z(d.getUTCDate())}/${z(d.getUTCMonth() + 1)} ${z(d.getUTCHours())}h${z(d.getUTCMinutes())}`; nv.gerado = new Date().toISOString();
    nv.novos = [{ assunto: 'Assunto novo que acabou de aparecer nos noticiários do país', relevante: true, n_fontes: 3, secao: 'politica', manchetes: [{ titulo: 'Assunto novo que acabou de aparecer nos noticiários do país', hora: hr }] },
      { assunto: 'Outro assunto recente com várias fontes noticiando agora', n_fontes: 2, secao: 'economia', manchetes: [{ titulo: 'Outro assunto recente com várias fontes noticiando agora', hora: hr }] }];
    fs.writeFileSync(path.join(DIR, 'novidades.json'), JSON.stringify(nv)) } catch (e) { console.log('  (sem novidades.json)', e.message) }
  FOTO = Buffer.alloc(30000);
  const srv = servidor(PORTA); await sleep(300);
  const EXE = process.env.PRUMO_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell') ? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' : undefined);
  try {
    for (const P of PERFIS) {
      PERFIL = P; LOG = [];
      const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'f4-'));
      const ctx = await require('playwright').chromium.launchPersistentContext(perfil, { executablePath: EXE, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
      await ctx.addInitScript(INIT);
      await ctx.route(u => !u.href.startsWith(`http://localhost:${PORTA}`), async r => { const q = r.request();
        try { if (/supabase\.js/.test(q.url())) return await r.fulfill({ response: await r.fetch({ url: `http://localhost:${PORTA}/__sbjs` }) });
          if (q.resourceType() === 'image') return await r.fulfill({ response: await r.fetch({ url: `http://localhost:${PORTA}/__foto?u=` + encodeURIComponent(q.url().slice(-40)) }) });
          return await r.fulfill({ status: 204, body: '' }) } catch (e) { } });
      const p = await ctx.newPage(); const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const cons = []; p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) cons.push(m.text()) }); p.on('pageerror', e => cons.push(e.message));
      T0 = Date.now(); await p.goto(`http://localhost:${PORTA}/`, { waitUntil: 'commit', timeout: 60000 });
      if (process.env.F4_FOTO && P.nome === '3G') { await U.esperar(p, () => window.__t && window.__t.pre > 0, null, 40000); await p.screenshot({ path: process.env.F4_FOTO + '-pre.png' }) }
      await U.esperar(p, () => window.__t && window.__t.real > 0 && document.readyState === 'complete', null, 40000); await sleep(3500);
      if (process.env.F4_FOTO && P.nome === '3G') await p.screenshot({ path: process.env.F4_FOTO + '-pronta.png' });
      const M = await p.evaluate(() => { const t = window.__t; const a = document.querySelector('#v-capa .cpi-man'), r = e => e && Math.round(e.getBoundingClientRect().top);
        const cp = document.querySelector('#v-capa .cp'), out = []; if (!cp) return { ...t, realHtml: '', vazio: (document.querySelector('#v-capa') || {}).outerHTML?.slice(0, 400) + ' | feed hidden=' + document.getElementById('v-feed').hidden }; for (const e of cp.children) { out.push(e.outerHTML); if (e.classList.contains('cpi-man')) break }
        return { ...t, realHtml: out.join(''), realRect: a ? { y: r(a), tY: r(a.querySelector('.cp-t')), sY: r(a.querySelector('.cp-sub')) } : null, sub: (a && a.querySelector('.cp-sub') || {}).textContent, tit: (a && a.querySelector('.cp-t') || {}).textContent } });
      console.log(`  ${P.nome}: alto antecipado ${M.pre || '-'} ms · Capa pronta ${M.real} ms · posição antes ${JSON.stringify(M.preRect)} · Capa pronta (na troca) ${JSON.stringify(M.realRect0)} · depois ${JSON.stringify(M.realRect)}`);
      if (M.vazio) console.log('     Capa vazia no fim: ' + M.vazio);
      console.log(`     título: ${M.tit} · linha fina: ${M.sub}`);
      if (process.env.DETALHE) console.log('     deslocamentos ' + JSON.stringify(M.cls));
      if (P.nome === '3G') {
        ok(M.pre > 0 && M.real - M.pre >= 1500, `3G: o alto da Capa aparece antes do código (${M.pre} ms, Capa pronta ${M.real} ms)`);
        const A = norm(M.preHtml), B = norm(M.realHtml0);  // a Capa pronta no momento da troca (depois a foto de arquivo pode entrar)
        if (process.env.F4_DUMP) { fs.writeFileSync(process.env.F4_DUMP + '.a.html', A); fs.writeFileSync(process.env.F4_DUMP + '.b.html', B) }
        let k = 0; while (k < A.length && A[k] === B[k]) k++;
        if (process.env.F4_CASO !== 'puro') ok(/cp-agora/.test(A) && /cp-corr/.test(A), 'o alto antecipado tem a faixa Agora e a correção', A.slice(0, 300));
        ok(A === B, 'o alto antecipado é igual ao da Capa pronta (marcação)', A === B ? '' : `difere em ${k}: antes «${A.slice(Math.max(0, k - 30), k + 260)}» · pronta «${B.slice(Math.max(0, k - 30), k + 260)}»`);
        ok(M.preRect && M.realRect0 && M.preRect.y === M.realRect0.y && M.preRect.tY === M.realRect0.tY && M.preRect.sY === M.realRect0.sY, 'a troca para a Capa pronta não mexe a manchete de lugar', [M.preRect, M.realRect0]);
        const sh = M.cls.filter(x => x.t > M.pre - 50 && x.t < M.real + 300).reduce((s, x) => s + x.v, 0);  // inclui a troca de fonte do título (Newsreader), pequena
        ok(sh < 0.02, `sem deslocamento de layout entre o alto antecipado e a Capa pronta (${sh.toFixed(4)})`, M.cls);
        ok(/hoje/i.test(M.tit) && !/\(\d+\)/.test(M.tit), 'a data da semana da manchete sai como "hoje" (como na Capa pronta)', M.tit);
      }
      ok(!cons.length, `${P.nome}: console limpo`, cons);
      if (P.nome === '4G') {
        // quem volta: a edição já está guardada; o 121 não desenha (o app desenha da edição guardada)
        await p.evaluate(() => sessionStorage.setItem('f4-volta', '1'));
        await p.reload({ waitUntil: 'commit' }); await U.esperar(p, () => window.__t && window.__t.real > 0, null, 40000); await sleep(1500);
        const V = await p.evaluate(() => ({ pre: window.__t.pre, f: !!localStorage.getItem('radar-feed') }));
        ok(V.f && !V.pre, 'quem volta (com edição guardada) não usa o alto antecipado', V);
      }
      await ctx.close(); fs.rmSync(perfil, { recursive: true, force: true });
    }
  } finally { srv.close(); fs.rmSync(DIR, { recursive: true, force: true }) }
  const R = U.resumo(); console.log(`\nRESUMO t_pre_capa: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { fs.rmSync(DIR, { recursive: true, force: true }) } catch (_) { } process.exit(2) });
