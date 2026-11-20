// Peso (19-20/11): mede quais funções de topo do script principal rodam em visitas típicas (sem conta e com conta).
// Saída: peso/frias.json = funções de topo que NÃO rodaram (nome + ordem entre as de mesmo nome), usadas pelo dividir.js.
// Uso: cd fonte && python3 build.py https://teste.supabase.co sb_publishable_teste123 --sem-minificar --saida site-cob && node peso/cobertura.js
const U = require('../t_util'); const { sleep, esperar } = U; const fs = require('fs'), path = require('path'), crypto = require('crypto');
const acorn = require(process.env.ACORN || 'acorn');
const PORTA = 9331, BASE = `http://localhost:${PORTA}/index.html`, PASTA = 'site-cob';
const ev = (p, f, a) => p.evaluate(f, a).catch(() => null);
(async () => {
  U.feedFresco(PASTA); const srv = U.servir(PASTA, PORTA); await sleep(800);
  const br = await U.navegador(); const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2),($2,$1)`, [ids.a, ids.b]);
  const quentes = new Map(); let fonte = null;
  const roda = async (nome, o, passos) => {
    const p = await H.pagina(br, { viewport: o.vp || { width: 390, height: 844 }, isMobile: !o.desk, hasTouch: !o.desk, sessao: o.k ? { user: { id: ids[o.k], email: o.k + '@x' } } : undefined });
    await p.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymous: true });
    await p.goto(BASE); await esperar(p, () => window.__prumoPronto && typeof FEED !== 'undefined' && FEED, null, 20000); await sleep(1500);
    if (o.k) await esperar(p, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 15000);
    await sleep(800); for (const f of passos) { try { await f(p) } catch (e) { console.log(nome, 'passo falhou', String(e).slice(0, 120)) } await sleep(500) }
    await sleep(9000);  // deixa rodar o que vem por tempo (conferência de versão, avisos, atualizações)
    const junta = cov => { for (const c of cov) { if (!c.source || c.source.length < 500000) continue; if (!fonte) fonte = c.source; if (c.source !== fonte) { console.log('fonte diferente em', nome); continue }
      for (const fn of c.functions) { const r = fn.ranges[0]; if (r && r.count > 0) quentes.set(r.startOffset, true) } } };
    junta(await p.coverage.stopJSCoverage()); await p.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymous: true });
    // volta ao app: mesma aba recarregada, com a edição e os ajustes já guardados (caminho da cópia guardada)
    await p.goto(BASE).catch(() => { }); await esperar(p, () => window.__prumoPronto && typeof FEED !== 'undefined' && FEED, null, 20000); await sleep(1200);
    for (const f of passos.slice(0, 2)) { try { await f(p) } catch (e) { } await sleep(400) } await sleep(6000);
    junta(await p.coverage.stopJSCoverage());
    await p.context().close(); console.log('ok', nome);
  };
  const fecha = p => ev(p, () => { let i = 0; while (($('#layer2') && $('#layer2').innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
  const rola = async (p, n = 6) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, 700); await sleep(250) } };
  const leitura = [
    async p => { await rola(p, 8); await ev(p, () => scrollTo(0, 0)) },
    async p => { await ev(p, () => { const b = document.querySelector('#v-capa [data-capmat], #v-capa [data-cpnovir], #v-capa .cpi-man button'); b && b.click() }); await sleep(1200); await ev(p, () => { const m = $('#layer .mat'); if (m) m.scrollTop = 4000 }); await sleep(600) },
    async p => { await ev(p, () => { const b = $('#layer [data-matprox]'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => go('feed')); await sleep(800); await rola(p, 10) },
    async p => { await ev(p, () => { const b = document.querySelector('#secs [data-sec-story], #secs .sb'); b && b.click() }); await sleep(1500); for (let i = 0; i < 3; i++) { await ev(p, () => { const n = document.querySelector('.story .tap-r, .story [data-stnext]'); n ? n.click() : (typeof storyNext === 'function' && storyNext()) }); await sleep(600) } await fecha(p) },
    async p => { await ev(p, () => go('busca')); await sleep(600); await p.fill('#bvq', 'senado').catch(() => { }); await sleep(900); await ev(p, () => { const b = document.querySelector('#bvres [data-capmat], #bvres [data-cpnovir], #bvres button'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => go('capa')); await sleep(500) },
  ];
  await roda('visitante celular', {}, leitura);
  await roda('visitante computador', { vp: { width: 1366, height: 860 }, desk: true }, leitura.slice(0, 4));
  await roda('membro celular', { k: 'b' }, leitura);
  await roda('admin celular', { k: 'a' }, leitura.slice(0, 2));
  // funções de topo do script principal (o maior <script>)
  const ast = acorn.parse(fonte, { ecmaVersion: 'latest', sourceType: 'script' }); const vistos = {}; const frias = [], todas = [];
  const novos = new Set(); acorn.parse && (function anda(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'NewExpression' && n.callee.type === 'Identifier') novos.add(n.callee.name); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(anda); else if (v && typeof v.type === 'string') anda(v) } })(ast);
  const offs = [...quentes.keys()].sort((a, b) => a - b);
  for (const s of ast.body) { if (s.type !== 'FunctionDeclaration' || !s.id) continue; const nm = s.id.name; const i = vistos[nm] = (vistos[nm] || 0) + 1;
    const q = offs.some(o => o >= s.start && o <= s.body.start); const tam = s.end - s.start; todas.push(tam);
    if (!q && !s.generator && !novos.has(nm)) frias.push({ n: nm, i, tam, h: crypto.createHash('sha1').update(fonte.slice(s.start, s.end)).digest('hex').slice(0, 10) }) }
  const tot = fonte.length, fr = frias.reduce((a, x) => a + x.tam, 0);
  fs.writeFileSync(path.join(__dirname, process.env.FRIAS_SAIDA || 'frias.json'), JSON.stringify({ gerado: new Date().toISOString(), funcoes: frias.map(x => [x.n, x.i, x.h]) }));
  console.log(`funções de topo: ${todas.length}; frias: ${frias.length} (${(fr / 1e3).toFixed(0)} KB de ${(tot / 1e3).toFixed(0)} KB do script, ${(100 * fr / tot).toFixed(1)}%)`);
  await br.close(); srv.kill(); process.exit(0) })().catch(e => { console.error(e); process.exit(2) });
