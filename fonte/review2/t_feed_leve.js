// Abertura leve (119-feed-leve.js + tools/feed_leve.py): a Capa sai do feed-leve.json, o detalhe chega depois.
// Confere: Capa só com o leve (detalhe preso) igual à Capa com o feed inteiro; detalhe encaixa depois (FEED = feed.json);
// matéria aberta antes do detalhe mostra o que tem e se completa; detalhe de outra versão → feed.json; leve ausente →
// caminho antigo; leve mais velho que a edição guardada → feed.json; volta com a mesma versão não baixa mais nada;
// versão nova → leve + detalhe; sem internet depois da primeira visita (service worker); busca no texto depois do detalhe.
// Serve uma cópia do site com a edição real do repositório (pasta fl119t/, apagada no fim). Portas 8734–8735.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const DIR = path.join(__dirname, '..', 'fl119t'), BASE = 'http://localhost:8734/', BASE2 = 'http://localhost:8735/';
const ev = (p, fn, a) => p.evaluate(fn, a);
const JPG = fs.readFileSync(path.join(__dirname, 'etapa13', 'foto.jpg'));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function dividir() { return cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]).toString().trim() }
function gravarFeed(f) { fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(f)); console.log('  ' + dividir()); return JSON.parse(fs.readFileSync(path.join(DIR, 'feed-leve.json'), 'utf8'))._leve.v }
(async () => {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = new Date(Date.now() - 12 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
  const V1 = gravarFeed(F);
  const srv = U.servir('fl119t', 8734), srv2 = U.servir('fl119t', 8735); await sleep(900);
  const H = await require('../harness').criar(); const b = await U.navegador();
  // pauta com texto (para a matéria) e uma palavra que só está no texto/contexto (para a busca)
  const alvo = [...F.pautas].sort((a, c) => String(c.neutro?.texto || '').length - String(a.neutro?.texto || '').length)[0];
  const raso = norm([...F.pautas.map(p => [p.neutro?.titulo, p.tag, p.tema, p.subtema, p.por_que].join(' ')), ...(F.breves || []).map(x => x.titulo), ...(F.dormentes || []).map(d => [d.titulo, d.resumo, d.tema, d.tag, d.subtema].join(' '))].join(' '));
  let palavra = null, dona = null;
  for (const p of F.pautas) { for (const w of norm(p.neutro?.texto).split(/[^a-z]+/)) { if (w.length >= 8 && !raso.includes(w)) { palavra = w; dona = p.id; break } } if (palavra) break }
  async function abrir(o = {}) {
    const p = U.erros(await H.pagina(b), o.nome || 'P'); const ctx = p.context(); const reqs = [];
    // fotos de fora (Agência Câmara, Wikimedia…) sempre carregam: sem internet, o onerror da foto mudava a Capa no meio da comparação
    await ctx.route(u => !/^localhost$|^127\./.test(u.hostname) && /\.(jpe?g|png|webp|gif)$/i.test(u.pathname), r => r.fulfill({ body: JPG, contentType: 'image/jpeg' }));
    p.on('request', r => { const u = r.url(); if (/feed(-leve)?\.json|feed-det\//.test(u)) reqs.push(u.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '')) });
    if (o.capa !== false) await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-teste-tour', '1'); localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
    let soltar = () => { }; if (o.prender) { const preso = new Promise(r => soltar = r); await ctx.route('**/feed-det/*.json', async r => { await preso; r.continue().catch(() => { }) }) }
    if (o.semLeve) await ctx.route('**/feed-leve.json', r => r.fulfill({ status: 404, body: '' }));
    if (o.det) await ctx.route('**/feed-det/*.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: o.det }));
    if (o.antes) await o.antes(p);
    await p.goto(o.url || BASE + 'index.html');
    return { p, ctx, reqs, soltar: () => soltar() };
  }
  const capaOk = p => esperar(p, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 10000);
  const completo = p => esperar(p, () => typeof FL119 !== 'undefined' && !FL119.parcial && FEED && FEED.pautas.some(x => x.neutro && x.neutro.texto), null, 10000);
  const igualAoFeed = p => ev(p, async () => { const r = await fetch('feed.json', { cache: 'no-store' }); const f = await r.json(); return feedTxt(f) === JSON.stringify(FEED) });

  // 1. Capa só com o leve (detalhe preso), igual à Capa desenhada com o feed inteiro
  const A = await abrir({ nome: 'A', prender: true });
  ok(await capaOk(A.p), 'Capa aparece com o detalhe preso');
  // a foto que já carregou ganha a classe "ok" (onload); a Capa redesenhada agora ainda não: compara sem esse estado
  const semCarga = h => h.replace(/ class="ok"/g, '').replace(/(class="[^"]+) ok"/g, '$1"');
  const capaLeve = semCarga(await ev(A.p, () => document.querySelector('#v-capa').innerHTML));
  ok(await ev(A.p, () => !!FL119.parcial && FEED.pautas.every(p => !p.neutro.texto && !(p.links || []).length)), 'a Capa está só com o leve (sem texto nem links)');
  ok(!A.reqs.includes('feed.json') && A.reqs.includes('feed-leve.json'), 'só o feed-leve.json foi pedido (não o feed.json)', A.reqs);
  ok(await ev(A.p, () => document.querySelector('#posts .post') === null), 'o Feed ainda não foi desenhado (espera o detalhe)');
  A.soltar();
  ok(await completo(A.p), 'o detalhe chega e entra nas pautas');
  ok(A.reqs.filter(u => u.startsWith('feed-det/')).length === 1 && A.reqs.includes('feed-det/' + V1 + '.json') && !A.reqs.includes('feed.json'), 'detalhe pedido uma vez, da mesma versão', A.reqs);
  ok(await igualAoFeed(A.p), 'depois do detalhe, a edição na memória é igual ao feed.json');
  const capaInteira = semCarga(await ev(A.p, () => { renderCapa(); return document.querySelector('#v-capa').innerHTML }));
  ok(capaLeve === capaInteira, 'Capa do leve = Capa do feed inteiro', (() => { let i = 0; while (i < capaLeve.length && capaLeve[i] === capaInteira[i]) i++; return [capaLeve.slice(i - 80, i + 120), capaInteira.slice(i - 80, i + 120)] })());
  ok(await ev(A.p, v => localStorage.getItem('prumo-fl-v') === v && JSON.parse(localStorage.getItem('radar-feed')).pautas.some(x => x.neutro.texto), V1), 'edição inteira guardada no aparelho, com a versão');
  ok(await esperar(A.p, () => document.querySelectorAll('#posts .post').length > 0, null, 8000), 'o Feed é desenhado depois (com tudo)');
  await A.p.tap('#t-feed'); await sleep(500);
  ok(await ev(A.p, () => VIEW === 'feed' && document.querySelectorAll('#posts .post').length > 0), 'Feed abre normalmente');
  ok(A.p._erros.length === 0, 'sem erros na página (A)', A.p._erros);
  // volta ao app com a mesma versão: só o leve (sem detalhe, sem feed.json)
  A.reqs.length = 0; await A.p.reload(); await capaOk(A.p); await sleep(1500);
  ok(A.reqs.length === 1 && A.reqs[0] === 'feed-leve.json', 'reabrir com a mesma versão: só o feed-leve.json', A.reqs);
  ok(await ev(A.p, () => !FL119.parcial && FEED.pautas.some(x => x.neutro.texto)), 'reabrir: edição inteira (do aparelho)');
  // edição nova: leve + detalhe novos, sem feed.json
  const F2 = JSON.parse(JSON.stringify(F)); F2.pautas[0].neutro.titulo = 'Título novo da edição seguinte'; F2.atualizado_em = new Date(Date.now() - 5 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
  const V2 = gravarFeed(F2);
  A.reqs.length = 0; await ev(A.p, () => { CHK_T = 0; return checarFeed(true) }); await sleep(800);
  ok(A.reqs.includes('feed-det/' + V2 + '.json') && !A.reqs.includes('feed.json'), 'versão nova (atualizar): leve + detalhe novo', A.reqs);
  ok(await ev(A.p, () => FEED.pautas[0].neutro.titulo === 'Título novo da edição seguinte' && FEED.pautas[0].neutro.texto), 'versão nova aplicada, inteira');
  ok(await igualAoFeed(A.p), 'versão nova = feed.json');
  ok(await ev(A.p, v => localStorage.getItem('prumo-fl-v') === v, V2), 'versão nova guardada');
  A.reqs.length = 0; await ev(A.p, () => { CHK_T = 0; return checarFeed(true) }); await sleep(500);
  ok(A.reqs.length === 1 && A.reqs[0] === 'feed-leve.json' && await ev(A.p, () => /Nada novo/.test(document.body.innerText) || true), 'atualizar de novo: só o leve', A.reqs);
  await A.ctx.close();

  // 2. matéria aberta antes do detalhe: mostra o que tem e se completa
  const M = await abrir({ nome: 'M', prender: true });
  await capaOk(M.p);
  await ev(M.p, id => abrirMateria(id), alvo.id); await sleep(300);
  const m1 = await ev(M.p, () => ({ t: document.querySelector('#layer .mat h1')?.textContent || '', sk: !!document.querySelector('#layer .fl119-sk'), p: document.querySelector('#layer .mat-p')?.textContent.trim().length || 0, pts: document.querySelectorAll('#layer .mat-30 li').length }));
  ok(m1.t.length > 5 && m1.pts > 0 && m1.sk && m1.p === 0, 'matéria antes do detalhe: título e pontos na hora, sinal de "carregando"', m1);
  M.soltar();
  ok(await esperar(M.p, () => !document.querySelector('#layer .fl119-sk') && (document.querySelector('#layer .mat-p')?.textContent.trim().length || 0) > 100, null, 8000), 'matéria se completa quando o detalhe chega');
  ok(await ev(M.p, id => MAT_PID === id && document.querySelector('#layer .mat-p').textContent.includes(FEED.pautas.find(x => x.id === id).neutro.texto.slice(0, 40)), alvo.id), 'é o texto da mesma matéria');
  ok(M.p._erros.length === 0, 'sem erros na página (M)', M.p._erros);
  await M.ctx.close();

  // 3. tocar na página da cobertura antes do detalhe: espera o detalhe e abre
  const C = await abrir({ nome: 'C', prender: true });
  await capaOk(C.p);
  const temCob = await ev(C.p, () => !!document.querySelector('#v-capa [data-cobpag]'));
  if (temCob) {
    await ev(C.p, () => document.querySelector('#v-capa [data-cobpag]').click()); await sleep(400);
    ok(await ev(C.p, () => !!FL119.parcial && !document.querySelector('.sheet .pc')), 'cobertura antes do detalhe: espera');
    C.soltar();
    ok(await esperar(C.p, () => !FL119.parcial && !!document.querySelector('.sheet .pc,[data-pc]'), null, 8000), 'cobertura abre quando o detalhe chega');
  } else { C.soltar(); ok(true, '(sem cobertura na Capa desta edição)') }
  await C.ctx.close();

  // 4. busca no texto: antes do detalhe não acha; depois acha sozinha
  if (palavra) {
    const B = await abrir({ nome: 'B', prender: true });
    await capaOk(B.p); await ev(B.p, () => go('busca')); await sleep(300); await B.p.fill('#bvq', palavra); await sleep(400);
    const antes = await ev(B.p, id => !!document.querySelector(`#bvres [data-busca="${id}"]`), dona);
    B.soltar(); await completo(B.p); await sleep(400);
    const depois = await ev(B.p, id => !!document.querySelector(`#bvres [data-busca="${id}"]`), dona);
    ok(!antes && depois, `busca no texto ("${palavra}") acha depois do detalhe`, { antes, depois });
    await B.ctx.close();
  } else ok(true, '(sem palavra só do texto para a busca)');

  // 5. detalhe de outra versão → feed.json
  const det1 = fs.readFileSync(path.join(DIR, 'feed-det', V2 + '.json'), 'utf8');
  const outro = JSON.parse(det1); outro.v = '000000000000';
  const X = await abrir({ nome: 'X', det: JSON.stringify(outro) });
  await capaOk(X.p); ok(await completo(X.p), 'detalhe de outra versão: o app se completa');
  ok(X.reqs.includes('feed.json'), 'detalhe de outra versão: usa o feed.json', X.reqs);
  ok(await igualAoFeed(X.p), 'detalhe de outra versão: edição = feed.json');
  ok(await ev(X.p, () => localStorage.getItem('prumo-fl-v') === null), 'sem versão conhecida guardada (próxima vez confere)');
  await X.ctx.close();
  // detalhe que não existe (404) → feed.json
  const X2 = await abrir({ nome: 'X2', antes: async p => p.context().route('**/feed-det/*.json', r => r.fulfill({ status: 404, body: '' })) });
  await capaOk(X2.p); ok(await completo(X2.p) && X2.reqs.includes('feed.json') && await igualAoFeed(X2.p), 'detalhe ausente: usa o feed.json', X2.reqs);
  await X2.ctx.close();

  // 6. sem feed-leve.json: caminho antigo
  const S = await abrir({ nome: 'S', semLeve: true });
  ok(await capaOk(S.p), 'sem leve: Capa aparece');
  ok(await ev(S.p, () => !FL119.parcial) && S.reqs.includes('feed.json') && !S.reqs.some(u => u.startsWith('feed-det/')), 'sem leve: feed.json, como antes', S.reqs);
  ok(await igualAoFeed(S.p), 'sem leve: edição = feed.json');
  ok(S.p._erros.length === 0, 'sem erros na página (S)', S.p._erros);
  await S.ctx.close();
  // leve quebrado (cabeçalho errado) → feed.json
  const Q = await abrir({ nome: 'Q', antes: async p => p.context().route('**/feed-leve.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"pautas":[]}' })) });
  ok(await capaOk(Q.p) && Q.reqs.includes('feed.json') && await igualAoFeed(Q.p), 'leve inválido: feed.json', Q.reqs);
  await Q.ctx.close();

  // 7. leve mais velho que a edição guardada (o robô ainda não rodou) → feed.json
  const novo = JSON.parse(JSON.stringify(F2)); novo.atualizado_em = new Date(Date.now() + 3600e3 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
  const G = await abrir({ nome: 'G', antes: async p => p.addInitScript(f => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('radar-feed', f); localStorage.setItem('prumo-fl-v', 'aaaaaaaaaaaa') } }, JSON.stringify(novo)) });
  await capaOk(G.p); await sleep(1200);
  ok(G.reqs.includes('feed.json') && !G.reqs.some(u => u.startsWith('feed-det/')), 'leve mais velho que o aparelho: confere no feed.json', G.reqs);
  ok(await igualAoFeed(G.p), 'leve mais velho: fica a edição do feed.json');
  await G.ctx.close();

  // 8. abrindo no Feed (sem "abrir na Capa"): leve + detalhe, sem o feed.json
  const D = await abrir({ nome: 'D', capa: false });
  ok(await esperar(D.p, () => document.querySelectorAll('#posts .post').length > 0, null, 10000), 'abrindo no Feed: posts aparecem');
  ok(await ev(D.p, () => !FL119.parcial) && !D.reqs.includes('feed.json') && D.reqs.includes('feed-det/' + V2 + '.json') && await igualAoFeed(D.p), 'abrindo no Feed: edição inteira por leve + detalhe', D.reqs);
  await D.ctx.close();

  // 9. sem internet depois da primeira visita (service worker registrado à mão, como no t_sw)
  const O = await abrir({ nome: 'O', url: BASE2 + 'index.html' });
  await capaOk(O.p); await completo(O.p);
  await ev(O.p, async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready }); await O.p.goto(BASE2); await capaOk(O.p); await sleep(1200);
  await O.ctx.setOffline(true);
  await O.p.goto(BASE2).catch(e => console.log('nav', e.message));
  ok(await capaOk(O.p), 'sem internet: Capa abre (cópia do aparelho)');
  await ev(O.p, id => abrirMateria(id), alvo.id); await sleep(400);
  ok(await ev(O.p, () => !document.querySelector('#layer .fl119-sk') && document.querySelector('#layer .mat-p').textContent.trim().length > 100), 'sem internet: matéria inteira');
  await O.ctx.setOffline(false); await O.ctx.close();

  await b.close(); srv.kill(); srv2.kill(); fs.rmSync(DIR, { recursive: true, force: true });
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
