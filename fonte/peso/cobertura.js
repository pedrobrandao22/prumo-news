// Peso (20/11, 3 partes): mede o que roda em cada momento de visitas típicas e grava peso/frias.json.
//  parte 1 (fica no index.html): tudo o que roda ao abrir na Capa e nos 12 s seguintes sem tocar em nada (visitante, membro
//          com notificações, admin, computador; primeira visita, volta ao app e sem internet)
//  parte 2: o que roda ao usar Feed, matéria, busca e giro (e rolar a Capa, abrir a Atividade e as Conversas)
//  parte 3: todo o resto
// Uso: cd fonte && python3 build.py https://teste.supabase.co sb_publishable_teste123 --sem-minificar --sem-dividir --saida site-cob
//      node peso/cobertura.js
const U = require('../t_util'); const { sleep, esperar } = U; const fs = require('fs'), path = require('path');
const acorn = require(process.env.ACORN || 'acorn'); const { unidades } = require('./unidades');
const PORTA = 9331, BASE = `http://localhost:${PORTA}/index.html`, PASTA = 'site-cob';
const ev = (p, f, a) => p.evaluate(f, a).catch(() => null);
(async () => {
  // os arquivos do dia (novidades, indicadores, fotos do acervo...) entram sempre: o que a Capa faz depende deles
  const AUX = ['novidades.json', 'indicadores.json', 'fotos-arquivo.json', 'oficiais.json'];
  const doDia = todos => { for (const f of (todos ? ['feed.json', 'feed-leve.json'] : []).concat(AUX)) try { fs.copyFileSync(path.join(U.REPO, f), path.join(__dirname, '..', PASTA, f)) } catch (e) { } };
  U.feedFresco(PASTA); doDia(false); const srv = U.servir(PASTA, PORTA); await sleep(800);
  const br = await U.navegador(); const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2),($2,$1)`, [ids.a, ids.b]);
  const quentes = { 1: new Set(), 2: new Set() }; let fonte = null;
  const junta = (cov, n, nome) => { for (const c of cov) { if (!c.source || c.source.length < 500000) continue; if (!fonte) fonte = c.source; if (c.source !== fonte) { console.log('fonte diferente em', nome); continue }
    for (const fn of c.functions) { const r = fn.ranges[0]; if (r && r.count > 0) quentes[n].add(r.startOffset) } } };
  const medir = async (p, n, nome, f) => { await p.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymous: true }); await f(); junta(await p.coverage.stopJSCoverage(), n, nome) };
  const abre = async p => { await p.goto(BASE).catch(() => { }); await esperar(p, () => window.__prumoPronto && typeof FEED !== 'undefined' && FEED, null, 20000) };
  const roda = async (nome, o, passos) => {
    const p = await H.pagina(br, { viewport: o.vp || { width: 390, height: 844 }, isMobile: !o.desk, hasTouch: !o.desk, sessao: o.k ? { user: { id: ids[o.k], email: o.k + '@x' } } : undefined });
    // abre na Capa, como uma pessoa (os testes automáticos abrem no Feed); o Feed escondido não é desenhado (no site dividido ele espera a parte 2)
    await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1') } catch (e) { } window.__pDepois = function () { } });
    // 1) abrir e ficar parado na Capa
    await medir(p, 1, nome, async () => { await abre(p); if (o.k) await esperar(p, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 15000); await sleep(12000) });
    // 2) usar Feed, matéria, busca e giro
    await medir(p, 2, nome, async () => { for (const f of passos) { try { await f(p) } catch (e) { console.log(nome, 'passo falhou', String(e).slice(0, 120)) } await sleep(500) } await sleep(3000) });
    // 1) volta ao app (cópia guardada) e sem internet: de novo só a abertura
    await medir(p, 1, nome, async () => { await abre(p); await sleep(9000) });
    await medir(p, 1, nome, async () => {
      await p.route(u => !/index\.html$|\/$|\.woff2$/.test(u.pathname || u.href), r => r.abort()).catch(() => { });
      await p.goto(BASE).catch(() => { }); await sleep(5000); await ev(p, () => { dispatchEvent(new Event('offline')) }); await sleep(3000);
      await (p.unrouteAll ? p.unrouteAll({ behavior: "ignoreErrors" }) : Promise.resolve()).catch(() => { }) });
    await p.context().close(); console.log('ok', nome);
  };
  const fecha = p => ev(p, () => { let i = 0; while (($('#layer2') && $('#layer2').innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
  const rola = async (p, n = 6) => { for (let i = 0; i < n; i++) { await p.mouse.wheel(0, 700); await sleep(250) } };
  const leitura = [
    async p => { await rola(p, 8); await ev(p, () => scrollTo(0, 0)) },
    async p => { await ev(p, () => { const b = document.querySelector('#v-capa [data-capmat], #v-capa [data-cpnovir], #v-capa .cpi-man button'); b && b.click() }); await sleep(1200); await ev(p, () => { const m = $('#layer .mat'); if (m) m.scrollTop = 4000 }); await sleep(600) },
    async p => { await ev(p, () => { const b = $('#layer [data-matprox]'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => { const b = document.querySelector('#v-capa .cpi-b[data-cpx], #v-capa [data-capair]'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => go('feed')); await sleep(800); await rola(p, 10) },
    async p => { await ev(p, () => { const b = document.querySelector('#posts .post [data-open], #posts .post .pv'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => { const b = document.querySelector('#secs [data-sec-story], #secs .sb'); b && b.click() }); await sleep(1500); for (let i = 0; i < 3; i++) { await ev(p, () => { const n = document.querySelector('.story .tap-r, .story [data-stnext]'); n ? n.click() : (typeof storyNext === 'function' && storyNext()) }); await sleep(600) } await fecha(p) },
    async p => { await ev(p, () => go('busca')); await sleep(600); await p.fill('#bvq', 'senado').catch(() => { }); await sleep(900); await ev(p, () => { const b = document.querySelector('#bvres [data-capmat], #bvres [data-cpnovir], #bvres button'); b && b.click() }); await sleep(900); await fecha(p) },
    async p => { await ev(p, () => go('capa')); await sleep(500); await ev(p, () => { const b = document.querySelector('#v-capa .at-b, .top-in .at-b'); b && b.click() }); await sleep(1000); await fecha(p) },
    async p => { await ev(p, () => go('msgs')); await sleep(900); await ev(p, () => go('capa')); await sleep(500) },
  ];
  await roda('visitante celular', {}, leitura);
  await roda('visitante computador', { vp: { width: 1366, height: 860 }, desk: true }, leitura);
  await roda('membro celular', { k: 'b' }, leitura);
  await roda('admin celular', { k: 'a' }, leitura);
  // de novo com o feed real do dia (manchete, ilustrações, coberturas e fotos de verdade)
  doDia(true); await roda('visitante celular, feed do dia', {}, leitura); await roda('admin computador, feed do dia', { k: 'a', vp: { width: 1366, height: 860 }, desk: true }, leitura);
  U.feedFresco(PASTA); try { fs.unlinkSync(path.join(__dirname, '..', PASTA, 'feed-leve.json')) } catch (e) { }
  const ast = acorn.parse(fonte, { ecmaVersion: 'latest', sourceType: 'script' });
  const q1 = [...quentes[1]].sort((a, b) => a - b), q2 = [...quentes[2]].sort((a, b) => a - b);
  const tem = (q, a, b) => { let lo = 0, hi = q.length; while (lo < hi) { const m = (lo + hi) >> 1; if (q[m] < a) lo = m + 1; else hi = m } return lo < q.length && q[lo] <= b };
  const partes = { 2: [], 3: [] }, tam = { 1: 0, 2: 0, 3: 0 }; let n1 = 0;
  for (const u of unidades(fonte, ast)) {
    const n = tem(q1, u.ini, u.corpo) ? 1 : tem(q2, u.ini, u.corpo) ? 2 : 3; tam[n] += u.fim - u.ini;
    if (n === 1) n1++; else partes[n].push(u.chave) }
  fs.writeFileSync(path.join(__dirname, process.env.FRIAS_SAIDA || 'frias.json'), JSON.stringify({ gerado: new Date().toISOString(), versao: 2, partes }));
  const kb = x => (x / 1e3).toFixed(0) + ' KB';
  console.log(`unidades: núcleo ${n1} (${kb(tam[1])}), parte 2 ${partes[2].length} (${kb(tam[2])}), parte 3 ${partes[3].length} (${kb(tam[3])}); script ${kb(fonte.length)}`);
  await br.close(); srv.kill(); process.exit(0) })().catch(e => { console.error(e); process.exit(2) });
